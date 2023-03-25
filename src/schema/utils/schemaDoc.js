
async function docsGenerator(schema, NODE_ENV, url){
  const sdl = require('@graphql-tools/utils').printSchemaWithDirectives(schema);
  const isShell = NODE_ENV !== 'test' ? true : false;

  const command = ' -f ./public/index.html';
  if(NODE_ENV !== 'test'){
    require('child_process').spawnSync("rm  "+command, { shell: !isShell });
  }

  const pathGraph = 'src/schema/gql/schema.graphql';
  const args = 'config.yml --one-file';
  const pathAssets = 'public/images/';
  const pathConfig = 'config.yml';

  const config = `
  spectaql:
    logoFile: ${pathAssets}logo.png
    faviconFile: ${pathAssets}favicon.png
    displayAllServers: true
  
  introspection:
    removeTrailingPeriodFromDescriptions: true
    schemaFile: ${pathGraph}
    fieldExpansionDepth: 10
    spectaqlDirective:
      enable: false
  extensions:
    graphqlScalarExamples: true
  info:
    title: Gateway API Referência
    description: Serviços unificados em um Gateway API
    x-introItems:
      - title: Utilize o postman para testar os endpoints
  servers:
    - url: ${url}
      description: Development`;

  await require('./schemaFsSync').writeFile(pathConfig, config, 'utf8');
  await require('./schemaFsSync').writeFile(pathGraph, sdl, 'utf8');

  // await new Promise((resolve) => require('child_process').spawnSync('spectaql  ' + args, { shell: isShell }, resolve(true)));
  
  const command2 = `npx spectaql ${args}`;
  await require('./schemaFsSync').exec(command2)
  const fileIndex = await require('./schemaFsSync').readFile('./public/index.html', 'utf8');
  const dataIndex = fileIndex
    .replace('src="images/logo.png"', 'src="docs/images/logo.png"')
    .replace('href="images/favicon.png"', 'href="docs/images/favicon.png"');
  await require('./schemaFsSync').writeFile('./public/index.html', dataIndex, 'utf8');
  return true;
}

module.exports.docsGenerator = docsGenerator;
