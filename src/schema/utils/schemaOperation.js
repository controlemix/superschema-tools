const path = require('path');
const { writeFile } = require('../../helpers/fs');
const { exec } = require('./schemaFsSync');
const  pathsApp  = {...require('../../core/paths').paths.baseAppPaths};
let fragmentsDefs = [];

function typesBuilder(schema) {
  let fieldDef = '';
  fragmentsDefs.forEach((_type) => {
    let _typesConn = [];
    _typesConn.push(`${_type.type}Edge`);
    _typesConn.push(`${_type.type}Connection`);
    _typesConn.push(_type.type);
    _typesConn.forEach(type => {
      fieldDef += `\ntype ${type} {\n`;
      Object.keys(schema.getTypeMap()[type]._fields).forEach((field) => {
        const fieldMap = schema.getTypeMap()[type]._fields[field];
        fieldDef += `  ${field}: ${fieldMap.type.ofType ? '[' + fieldMap.type.ofType + ']' : fieldMap.type.name}\n`;
        fieldDef = fieldDef
          .replace('[ID]', 'ID')
          .replace('cursor: [String]', 'cursor: String')
          .replace('pageInfo: [PageInfo]', 'pageInfo: PageInfo');
      });
      fieldDef += `}\n`;
    });
  });
  return { fieldDef }
}

function fieldOperationBuilder(schema) {
  const argsFixed = 'first: Int, after: String, loadDate: String, updateDate: String, sourceSystem: String';
  fragmentsDefs = [];
  Object.keys(schema.getTypeMap()).forEach((_type) => {
    if (_type.includes('Connection')) {
      fragmentsDefs.push({
        type: _type.replace('Connection', ''),
        typeOperation: _type,
        args: argsFixed,
        operation: _type.replace('Connection', '').toLowerCase(),
        operationAll: _type.replace('Connection', '').toLowerCase(),
      });
    }
  });

  let operationList = `\ntype Query {\n`;
  fragmentsDefs.forEach((opeItem) => {
    operationList += `  ${opeItem.operationAll}(${opeItem.args}): ${opeItem.typeOperation}\n`;
  });
  operationList += `}`;
  return operationList;
}

async function operationBuilderSuper(schema, NODE_ENV) {
  const operations = fieldOperationBuilder(schema);
  let typesDefs = `
  schema {
    query: Query

  }\n
  ${operations}\n
  type PageInfo {
    hasNextPage: Boolean
    hasPreviousPage: Boolean
    startCursor: String
    endCursor: String
  }\n
  scalar Date
  `;
  const { fieldDef } = typesBuilder(schema);
  typesDefs += `
 ${fieldDef}
    `;

  if (NODE_ENV !== 'test') {
    const pathTypes = require('path').join(pathsApp.supergraph, `/sdl/typeDefs.graphql`);
    const destPath = require('path').join(pathsApp.supergraph, `/operations`);

    await writeFile(pathTypes, typesDefs);
    const command = `npx gqlg --schemaFilePath ${pathTypes} --destDirPath ${destPath}`
    await exec(command)
    // createOperations('--schemaFilePath ./src/schema/gql/supergraph/sdl/typeDefs.graphql --destDirPath ./src/schema/gql/supergraph/operations', NODE_ENV)
  }
  return { typesDefs };
}

async function operationBuilderFrag(schema, NODE_ENV) {
  const operations = fieldOperationBuilder(schema);
  let typesDefs = `schema {\n  query: Query \n}\n${operations}\n
type PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor: String
  endCursor: String
}\n
scalar Date
`;
  const { fieldDef } = typesBuilder(schema);
  typesDefs += `${fieldDef}\n`;
  if (NODE_ENV !== 'test') {
    const pathTypes = require('path').join(pathsApp.subgraphs, `/frags/sdl/typeDefs.graphql`);
    const destPath = require('path').join(pathsApp.subgraphs, `/frags/operations`);
    // const pathTypes = `${pathsApp.subgraphs}/frags/sdl/typeDefs.graphql`;
    // const destPath = `${pathsApp.subgraphs}/frags/operations`;
    await writeFile(pathTypes, typesDefs);
    
    // pathGql = path.join(pathProj, 'src/schema/gql','/**/*.js');
    const command = `npx gqlg --schemaFilePath ${pathTypes} --destDirPath ${destPath}`
    await exec(command)

    // createOperations(`--schemaFilePath ${pathTypes} --destDirPath ${destPath}`, NODE_ENV)
  }
  return { typesDefs }
}

async function operationBuilder(schema, service, NODE_ENV) {
  const operations = fieldOperationBuilder(schema);
  service = service.toLowerCase();
  let typesDefs = `schema {\n  query: Query \n}\n${operations}\n
type PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor: String
  endCursor: String
}\n
scalar Date
`;
  const { fieldDef } = typesBuilder(schema);
  typesDefs += `${fieldDef}\n`;
  if (NODE_ENV !== 'test') {
    const pathTypes = require('path').join(pathsApp.subgraphs, `/${service}/sdl/typeDefs.graphql`);
    const destPath = require('path').join(pathsApp.subgraphs, `/${service}/operations`);

    // const pathTypes = `${pathsApp.subgraphs}/${service}/sdl/typeDefs.graphql`;
    // const destPath = `${pathsApp.subgraphs}/${service}/operations`;
    await writeFile(pathTypes, typesDefs);
    const command = `npx gqlg --schemaFilePath ${pathTypes} --destDirPath ${destPath}`
    await exec(command)
    // createOperations(`--schemaFilePath ${pathTypes} --destDirPath ${destPath}`, NODE_ENV)
  }
  return { typesDefs }
}

function getOperation(operation, _service) {
  let ope = undefined;
  let pathOperation = undefined;
  if(process.env['NODE_ENV']!=='test'){
    pathOperation = require('path').join(pathsApp.subgraphs, `/frags/operations`);
    ope = require(pathOperation);
  }else{
    pathOperation = require('path').join(pathsApp.subgraphs, `/${_service}/operations`);
    ope = require(pathOperation);
  }
  const fieldQuery = operation.replace('Frag', '');
  const query = ope.queries[fieldQuery] ? ope.queries[fieldQuery].replace(`query ${fieldQuery}(`, `query ${fieldQuery}Frag(`) : undefined;
  return { query }
}

function getOperationSuper(operation, gatewayOpe) {
  const pathOperation = require('path').join(pathsApp.supergraph, `/operations`);
  const ope = require(pathOperation)
  const fieldQuery = operation.replace('All', '');
  if (!ope.queries[fieldQuery]) {
    return { query: undefined }
  } else {
    const query = gatewayOpe ? ope.queries[fieldQuery].replace(`query ${fieldQuery}(`, `query ${gatewayOpe}(`) : ope.queries[fieldQuery].replace(`query ${fieldQuery}(`, `query ${fieldQuery}All(`);
    return { query }
  }
}

function validateOperation(operation) {
  const pathOperation = require('path').join(pathsApp.supergraph, `/operations`);
  const ope = require(pathOperation);
  const fieldQuery = operation.replace('All', '');
  if (ope.queries[fieldQuery]) {
    return true;
  } else {
    return undefined;
  }
}

module.exports = {
  typesBuilder,
  operationBuilder,
  getOperation,
  validateOperation,
  getOperationSuper,
  operationBuilderSuper,
  operationBuilderFrag
}
