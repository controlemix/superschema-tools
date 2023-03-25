function startServer() {
  return new Promise(async (resolve, _reject) => {
    
    const clc = require('cli-color');
    const path = require('path');

    const modPaths = require('./core/paths').paths.baseModPaths;
    let environmentArg = '';
    let useEnvMaster = false;
    if (process.env['NODE_ENV'] == 'test') {
      environmentArg = 'test';
    } else {
      environmentArg = process.argv.find((env) => env.includes('environment'));
      environmentArg = environmentArg ? environmentArg.split('=')[1] : undefined;
      useEnvMaster = environmentArg ? false : true;
    }
    const _ENV = require(`${modPaths.helpers}/parseEnv`).getEnv(useEnvMaster, environmentArg);
    const _SERVER = await createApolloServer(_ENV.ENVIRONMENTS);

    const { GQL_PATH, GQL_ENDPOINT, CORE_PATHS, GENERATOR } = _ENV.ENVIRONMENTS;
    const param = { GQL_ENDPOINT, SERVICES: _SERVER.listSdl, NODE_ENV: _ENV.ENVIRONMENTS.NODE_ENV, PATH: GQL_PATH };

    const { operationsJob, operationsSuperJob } = require(path.join(CORE_PATHS.baseModPaths.utils, '/..', '/jobs/operationsJob'));
    await operationsJob(_SERVER.detailSchemas, _ENV.ENVIRONMENTS.NODE_ENV);
    await operationsSuperJob(_SERVER.server.config.schema, _ENV.ENVIRONMENTS.NODE_ENV);
    
    if(GENERATOR){       
      setTimeout(() => { process.exit(0); },3000);
      require(`${CORE_PATHS.baseModPaths.helpers}/actionsHandles`).tx2?.emit?.('READY', param);
      resolve({ server: _SERVER.server, url: _SERVER.url, ENVIRONMENTS: _ENV.ENVIRONMENTS, schema: _SERVER.schema });
    }else{
      if(_ENV.ENVIRONMENTS.NODE_ENV!== 'test'){
        console.log('');
        console.log(clc.magentaBright('generating docs schedule start in 5 seconds'));
        console.log('');
        setTimeout( async () => {
          try {
            await require(`${CORE_PATHS.baseModPaths.utils}/schemaDoc`).docsGenerator(_SERVER.server.config.schema, _ENV.ENVIRONMENTS.NODE_ENV, GQL_PATH + GQL_ENDPOINT);  
          } catch (error) {}
          
        }, 5000);
      }
    }
    
    require(`${CORE_PATHS.baseModPaths.helpers}/actionsHandles`).tx2?.emit?.('READY', param);
    resolve({ server: _SERVER.server, url: _SERVER.url, ENVIRONMENTS: _ENV.ENVIRONMENTS, schema: _SERVER.schema });
  });
}

async function createApolloServer(ENVIRONMENTS) {
  const { ApolloServer } = require('apollo-server-express');
  const { ApolloServerPluginDrainHttpServer, ApolloServerPluginInlineTrace } = require('apollo-server-core');
  
  const express = require('express');
  const { GQL_PATH, SERVICES, NODE_ENV, GQL_PORT, GQL_ENDPOINT, mocks, GQL_MOCK, CORE_PATHS } = ENVIRONMENTS;

  await require('./helpers/validateDirs').validateDirs(CORE_PATHS.baseAppPath, SERVICES);
  const listSdl = await require('./schema/jobs/fetchSchemaJob').fetchSchemaJob(CORE_PATHS.baseAppPath, SERVICES);
  const { schema, detailSchemas } = await require(`${CORE_PATHS.baseModPaths.utils}/schemaGateway`).wrapSchemaService(SERVICES, listSdl, NODE_ENV);

  const http = require('http');
  const app = express();
  const httpServer = http.createServer(app);
  await require(`${CORE_PATHS.baseModPaths.utils}/schemaRoutes`).applyMiddlewareApp(app, ENVIRONMENTS, express);

  let apolloDefinition = {
    schema,
    subscriptions: false,
    tracing: true,
    engine: true,
    introspection: true,
    csrfPrevention: false,
    debug: true,
    HealthCheck: true,
    cache: 'bounded',
    stopOnTerminationSignals: true,
    stopGracePeriodMillis: 3000,
    cors: false,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginInlineTrace({ tracing: true }),
      require(`${CORE_PATHS.baseModPaths.utils}/schemaPlugins`).executionPlugin,
    ],
  };

  if (GQL_MOCK == 1) {
    let _mocks = {
      ...mocks,
      String: () => 'Fix',
      Date: () => {
        return new Date();
      },
    };
    apolloDefinition.mocks = _mocks;
  }

  const server = new ApolloServer(apolloDefinition);
  await server.start();
  server.applyMiddleware({ app, path: GQL_ENDPOINT, cors: false });
  await new Promise((resolve) => httpServer.listen({ port: GQL_PORT }, resolve));



  return { server, url: GQL_PATH, schema: server.config.schema, listSdl, detailSchemas };
}

module.exports.startServer = startServer;
module.exports.createApolloServer = createApolloServer;
module.exports.readFile = require('./helpers/fs').readFile;
module.exports.getEnv = require('./helpers/parseEnv').getEnv;
module.exports.removeOperationsFrag =  require('./schema/utils/schemaFsSync').removeOperationsFrag;
module.exports.applyMiddlewareApp =  require('./schema/utils/schemaRoutes').applyMiddlewareApp;

// module.exports = {
  // startServer,
  // createApolloServer,
  // readFile: require('./helpers/fs').readFile,
  // readFile: require('./schema/utils/schemaFsSync').readFile,
  // getSubSchema: require('./schema/utils/schemaGateway').getSubSchema,
  // getOperation: require('./schema/utils/schemaOperation').getOperation,
  // getEnv: require('./helpers/parseEnv').getEnv,
  // applyMiddlewareApp: require('./schema/utils/schemaRoutes').applyMiddlewareApp,
  // removeOperationsFrag: require('./schema/utils/schemaFsSync').removeOperationsFrag,
  // checkFileExists: require('./schema/utils/schemaFsSync').checkFileExists,
// };
