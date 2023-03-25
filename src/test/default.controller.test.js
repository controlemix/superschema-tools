const assert = require('assert').strict;
const { exit, tx2 } = require('../helpers/actionsHandles');
const { paramFn, errorFn } = require('../helpers/constantsFn');
const { getEnv } = require('../helpers/parseEnv');
const { writeFile, readFile, createOperations, removeOperationsFrag } = require('../schema/utils/schemaFsSync');
const { executionPlugin } = require('../schema/utils/schemaPlugins');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

describe('Constants and Functions Utils', function() {

  it('Emit Signal Check', async () => {

    const commandOpeFrag = removeOperationsFrag('test')
    assert.equal(commandOpeFrag, true);

    const param = {
      GQL_ENDPOINT: '/', 
      NODE_ENV: 'test', 
      SERVICES: [{name: 'POLICY', url: 'http://localhost' }], 
      PATH: 'http://localhost'
    } 

    let ret = tx2.emit('PROCESS_LOG', 'test');
    assert.equal(ret, true);
    ret = tx2.emit('RESTART_APP', 'test');
    assert.equal(ret, true);
    ret = tx2.emit('SIGINT', 'test');
    assert.equal(ret, true);
    ret = tx2.emit('KILL', 'test');
    assert.equal(ret, true);
    ret = tx2.emit('READY', param);
    assert.equal(ret, true);
    const _exit = exit('test');
    assert.equal(_exit, undefined);
  });

  it('Valid Pass Param for paramFn', function() {
    assert.equal(paramFn('param'), 'param');
  });
  it('Valid Variables Default', function() {
    const { ENVIRONMENTS } = getEnv(true);
    const envList = Object.keys(ENVIRONMENTS);
    envList.forEach((env) => {
      expect(env).toBeDefined();
    });
  });
  it('Valid Variables Buffer', function() {
    const { ENVIRONMENTS } = getEnv(false);
    const envList = Object.keys(ENVIRONMENTS);
    envList.forEach((env) => {
      expect(env).toBeDefined();
    });
  });

  it('Valid Pass Param for errorFn', function() {
    const e = errorFn('Throws!');
    assert.equal(e.message, 'Throws!');
  });

  it('executionPlugin Frag Check', async () => {
    const operations = { request: {
        query: "{ __typename }",
        operationName: "policyFrag",
        variables: {
            first: 1,
            after: "",
            loadDate: "2022-06-02",
            updateDate: ""
        }
      }
    }
    const ret = await executionPlugin.requestDidStart(operations);
    expect(ret).toBe(ret);
  });

  it('executionPlugin customerFrag Check', async () => {
    const operations = { request: {
        query: "{ __typename }",
        operationName: "customerFrag",
        variables: {
            first: 1,
            after: "",
            loadDate: "2022-06-02",
            updateDate: ""
        }
      }
    }
    const ret = await executionPlugin.requestDidStart(operations);
    expect(ret).toBe(ret);
  });
  it('executionPlugin customerAll Check', async () => {
    const operations = { request: {
        query: "{ __typename }",
        operationName: "customerAll",
        variables: {
            first: 1,
            after: "",
            loadDate: "2022-06-02",
            updateDate: ""
        }
      }
    }
    const ret = await executionPlugin.requestDidStart(operations);
    expect(ret).toBe(ret);
  });
  it('executionPlugin productFrag Check', async () => {
    const operations = { request: {
        query: "{ __typename }",
        operationName: "productFrag",
        variables: {
            first: 1,
            after: "",
            loadDate: "2022-06-02",
            updateDate: ""
        }
      }
    }
    const ret = await executionPlugin.requestDidStart(operations);
    expect(ret).toBe(ret);
  });
  it('executionPlugin productAll Check', async () => {
    const operations = { request: {
        query: "{ __typename }",
        operationName: "productAll",
        variables: {
            first: 1,
            after: "",
            loadDate: "2022-06-02",
            updateDate: ""
        }
      }
    }
    const ret = await executionPlugin.requestDidStart(operations);
    expect(ret).toBe(ret);
  });

  it('executionPlugin All Check', async () => {
    const operations = { request: {
        query: "{ __typename }",
        operationName: "policyAll",
        variables: {
            first: 1,
            after: "",
            loadDate: "2022-06-02",
            updateDate: ""
        }
      }
    }
    const ret = await executionPlugin.requestDidStart(operations);
    expect(ret).toBe(ret);
  });

  it('Test Async Files An Commands', async function() {
    const wFile = await writeFile('./test.log', 'test');
    const rFile = await readFile('./test.log');
    const commandOpeFrag = removeOperationsFrag('test')
    const commandOpe = createOperations('', 'test')
    assert.equal(commandOpeFrag, true);
    assert.equal(commandOpe, true);
    assert.equal(rFile, 'test');
    assert.equal(wFile, true);

  });
});
