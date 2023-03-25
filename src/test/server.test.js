const fetch = require('node-fetch');
const { getEnv, decrypt, extractEnv, createBasicAuth } = require('../helpers/parseEnv');
const { ApolloServer, gql } = require('apollo-server-express');
const { getSubSchema, wrapSchemaService } = require('../schema/utils/schemaGateway');
const { getOperation, getOperationSuper, validateOperation } = require('../schema/utils/schemaOperation');
const { startApolloGateway } = require('../server');
const { print } = require('graphql');
const { coverageResolver } = require('../schema/resolvers/Coverage');
const { policyResolver } = require('../schema/resolvers/Policy');
const express = require('express');
const { applyMiddlewareApp } = require('../schema/utils/schemaRoutes');
const { ApolloServerPluginDrainHttpServer, ApolloServerPluginInlineTrace  } = require('apollo-server-core');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe('Check Server Exist', () => {
  jest.setTimeout(15000);
  let dataTypes,
    queryPolicy,
    queriesSuper,
    queriesSubCustomer,
    queriesSubPolicy,
    queriesSubProduct,
    policyTypes,
    productTypes,
    customerTypes,
    server


  const assert = require('assert').strict;
  const { readFile, removeOperationsFrag } = require('../schema/utils/schemaFsSync');

  beforeAll(async () => {
    dataTypes = await readFile(`./src/schema/gql/supergraph/sdl/typeDefs.graphql`);
    policyTypes = await readFile(`./src/schema/gql/subgraphs/policy/sdl/typeDefs.graphql`);
    productTypes = await readFile(`./src/schema/gql/subgraphs/product/sdl/typeDefs.graphql`);
    customerTypes = await readFile(`./src/schema/gql/subgraphs/customer/sdl/typeDefs.graphql`);
    queryPolicy = await readFile(`./src/schema/gql/supergraph/operations/queries/policy.gql`);
    queriesSubPolicy = require(`../schema/gql/subgraphs/policy/operations/index`);
    queriesSubCustomer = require(`../schema/gql/subgraphs/customer/operations/index`);
    queriesSubProduct = require(`../schema/gql/subgraphs/product/operations/index`);
    queriesSuper = require(`../schema/gql/supergraph/operations/index`);
  });

  it('Tests for Services in Gateway Federation', async () => {
    const commandOpeFrag = removeOperationsFrag('test')
    assert.equal(commandOpeFrag, true);

    const {ENVIRONMENTS} = getEnv(false, 'test');

    const typeDefsPolicy = gql` ${policyTypes} `;

    const appPolicy = express();

    await applyMiddlewareApp(appPolicy, ENVIRONMENTS, express);
    const httpServerPolicy = require('http').createServer(appPolicy);

    let apolloDefinition = {
      typeDefs: typeDefsPolicy,
      subscriptions: false,
      playground: true,
      introspection: true,
      csrfPrevention: false,
      HealthCheck: true,
      cache: 'bounded',
      stopOnTerminationSignals: true,
      stopGracePeriodMillis: 3000,
      bodyParserConfig: true,
      cors: false,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer:httpServerPolicy }),
        ApolloServerPluginInlineTrace(),
      ]
    }   

    const serverPolicy = new ApolloServer(apolloDefinition);
    await serverPolicy.start();
    serverPolicy.applyMiddleware({ app: appPolicy, path: '/' });  
    await new Promise(resolve => httpServerPolicy.listen({ port: 8093 }, resolve));


    // const typeDefsCustomer = gql` ${customerTypes} `;
    // const serverCustomer = new ApolloServer({ typeDefs: typeDefsCustomer });
    // serverCustomer.listen({ port: 8030 }).then(({ url }) => { });

    // const typeDefsProduct = gql` ${productTypes} `;
    // const serverProduct = new ApolloServer({ typeDefs: typeDefsProduct });
    // serverProduct.listen({ port: 8034 }).then(({ url }) => { });

    // const { ENVIRONMENTS } = getEnv(false, 'test');
    const { server, url } =  startApolloGateway(ENVIRONMENTS);

    const variables = {
      query: queryPolicy,
      operationName: 'policy',
      variables: {
        first: 1,
        after: '',
        loadDate: '2022-06-02',
        updateDate: '',
      },
    };
    const query = print(gql`${queryPolicy}`);

    const fetchResult = await fetch('http://localhost:8093', {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    // const logResult = await fetch('http://localhost:4000/api/logs/out', {
    //   method: 'GET',
    //   rejectUnauthorized: false,
    //   headers: {
    //     'Content-Type': 'application/text',
    //   },
    // });
    // const errorResult = await fetch('http://localhost:4000/api/logs/error', {
    //   method: 'GET',
    //   rejectUnauthorized: false,
    //   headers: {
    //     'Content-Type': 'application/text',
    //   },
    // });
    // const restartResult = await fetch('http://localhost:4000/api/reconnect?token=underlinux', {
    //   method: 'GET',
    //   rejectUnauthorized: false,
    //   headers: {
    //     'Content-Type': 'application/text',
    //   },
    // });
    // const voyagerResult = await fetch('http://localhost:4000/api/voyager', {
    //   method: 'GET',
    //   rejectUnauthorized: false,
    //   headers: {
    //     'Content-Type': 'application/text',
    //   },
    // });

    const res = await fetchResult.json();

    // const _env_ = process.env['ENVIRONMENTS']
    // const { schema, subschemas, detailSchemas } = await wrapSchemaService(ENVIRONMENTS.SERVICES, 'test')
    // const subschemasPolicy = getSubSchema(subschemas, 'Policy', detailSchemas);
    // const subschemasCustomer = getSubSchema(subschemas, 'Customer', detailSchemas);
    // const subschemasProduct = getSubSchema(subschemas, 'Product', detailSchemas);

    // const { Coverage } = await coverageResolver(subschemas, detailSchemas)
    // const productsResolve = Coverage.products['resolve']

    // const { Policy } = await policyResolver(subschemas, detailSchemas);
    // const policysResolver = Policy.customers['resolve'];

    // try {
    //   await productsResolve('', [''])
    // } catch (error) {
    //   expect(error).toBeDefined();
    // }
    // try {
    //   await policysResolver('', [''])
    // } catch (error) {
    //   expect(error).toBeDefined();
    // }

    // expect(_env_).toBeDefined();
    // expect(subschemasPolicy).toBeDefined();
    // expect(subschemasCustomer).toBeDefined();
    // expect(subschemasProduct).toBeDefined();
    // expect(schema).toBeDefined();
    // expect(subschemas).toBeDefined();
    // expect(detailSchemas).toBeDefined();

    // let policyFrag = await getOperation('policyFrag', 'policy');
    // expect(policyFrag).toBeDefined();
    // policyFrag = await getOperation('p2icys', 'policy');
    // expect(policyFrag).toBeDefined();

    // let policyAll = await getOperationSuper('policyAll', 'policy');
    // expect(policyAll).toBeDefined();
    // policyAll = await getOperationSuper('p2olicy', 'policy');
    // expect(policyAll).toBeDefined();

    // let checkEncode = decrypt('teste', true);
    // expect(checkEncode).toBeDefined();
    // checkEncode = decrypt('teste', false);
    // expect(checkEncode).toBeDefined();
    // let checkBasicAuth = createBasicAuth('test', '123');
    // expect(checkBasicAuth).toBeDefined();

    // const valOpe1 = await validateOperation('policyAll');
    // assert.equal(valOpe1, true);
    // const valOpe2 = await validateOperation('policyssAsll');
    // assert.equal(valOpe2, undefined);
    // expect(voyagerResult).toBeDefined();
    // expect(restartResult).toBeDefined();
    // expect(errorResult).toBeDefined();
    // expect(logResult).toBeDefined();
    expect(res).toBeDefined();
    // expect(dataTypes).toBeDefined();
    // expect(policyTypes).toBeDefined();
    // expect(productTypes).toBeDefined();
    // expect(customerTypes).toBeDefined();
    // expect(queriesSuper).toBeDefined();
    // expect(queriesSubCustomer).toBeDefined();
    // expect(queriesSubPolicy).toBeDefined();
    // expect(queriesSubProduct).toBeDefined();
    // expect(queryPolicy).toBeDefined();
    // expect(server).toBeDefined();
    // expect(ENVIRONMENTS).toBeDefined();
    // let checkExtractEnv = extractEnv('test');
    // expect(checkExtractEnv).toBeDefined();
  });
});
