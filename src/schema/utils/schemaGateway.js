const fetch = require('node-fetch');
const { print } = require('graphql');
const { stitchSchemas } = require('@graphql-tools/stitch');
const fromGlobalId = require('graphql-relay').fromGlobalId;
const { buildSchema } = require('graphql');
const { federationToStitchingSDL } = require('@graphql-tools/stitching-directives');
const path = require('path');

function servicesBuilder(services, listSdl) {
  const subschemas = [];
  const detailSchemas = [];

  services.forEach((service) => {
    const { url, header } = service;
    const name = service.name.toLowerCase()
    async function executor({ document, variables }) {
      let result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `${header}` },
        body: JSON.stringify({ query: print(document), variables }),
      });
      result = await result.json();
      return result;
    }

    const itemSdl = listSdl.find((serviceItem) => serviceItem.name.toLowerCase() === name);
    const fedSdl = itemSdl.isGetRemoteSdl ? federationToStitchingSDL(itemSdl.sdlRemoteData, { mergeDirectiveName: '@key' }) : federationToStitchingSDL(itemSdl.sdlLocalData, { mergeDirectiveName: '@key' });
    const schema = buildSchema(fedSdl);

    detailSchemas.push({ name, schema, executor, url, header });
    subschemas.push({ schema, executor });

  });

  return { subschemas, detailSchemas };
}


function getResolversDelegate(subschemas, detailSchemas) {
  let preResolvers = require('../resolvers').getListResolvers().listResolvers;
  let resolvers_ = {};

  preResolvers.forEach(async (type) => {
    const key = Object.keys(type);
    const { subSchemaName, __typename, __fieldname, selectionSet, args } = type[key];
    const factoryResolver = {
      [__typename]: {
        [__fieldname]: {
          selectionSet,
          resolve(_parent, _args, context, info) {
            let values = ``
            const listArgs = Object.keys(args);
            listArgs.forEach(key => {
              values += `,"${key}":"${_parent[key]}"`
            });
            const representations = [JSON.parse(`{ "__typename": "${subSchemaName}" ${values}}`)]
            const index = detailSchemas.findIndex((dsubschema) => dsubschema.name === subSchemaName.toLowerCase());
            return require('@graphql-tools/delegate').delegateToSchema({
              schema: subschemas[index],
              operation: 'query',
              fieldName: '_entities',
              args: { representations },
              context,
              info,
            });
          },
        },
      },
    };

    resolvers_ = { ...resolvers_, ...factoryResolver };
  });


  return { resolvers: resolvers_ };
}

const wrapSchemaService = async (services, listSdl, NODE_ENV) => {
  const { subschemas, detailSchemas } = servicesBuilder(services, listSdl);
  const { resolvers } = getResolversDelegate(subschemas, detailSchemas);

  const pathTypes = path.join(require('../../core/paths').paths.baseAppPaths.typeDefs, `schemaFederated`);
  const { getTypeDefs }  = require(pathTypes);

  const schema = stitchSchemas({
    subschemas,
    mergeTypes: true,
    typeDefs: await getTypeDefs(NODE_ENV),
    resolvers: {
      ...resolvers,
      Query: {
        node: {
          selectionSet: `{ id }`,
          resolve(_parent, _args, context, info) {
            const { type } = fromGlobalId(_args.id);
            const index = detailSchemas.findIndex((dsubschema) => dsubschema.name === type.toLowerCase());
            return require('@graphql-tools/delegate').delegateToSchema({
              schema: subschemas[index],
              operation: 'query',
              fieldName: 'node',
              args: { id: _args.id },
              context,
              info,
            });
          },
        },
        _entities: {
          resolve(_parent, _args, context, info) {
            const _v0_representations = _args?._v0_representations?.[0]?.__typename;
            const _representations = _args?.representations?.[0]?.__typename;
            const type = _v0_representations ? _v0_representations : _representations;
            const index = detailSchemas.findIndex((dsubschema) => dsubschema.name === type.toLowerCase());
            return require('@graphql-tools/delegate').delegateToSchema({
              schema: subschemas[index],
              operation: 'query',
              fieldName: '_entities',
              args: { representations: _args.representations },
              context,
              info,
            });
          },
        },
      },
    },
  });

  
  return { schema, subschemas, detailSchemas };
};

module.exports.wrapSchemaService = wrapSchemaService;
