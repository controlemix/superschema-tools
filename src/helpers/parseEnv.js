const yaml = require('yamljs');
const corePaths = require('../core/paths').paths;

function decrypt(key, isDecrypt) {
  return isDecrypt ? Buffer.from(key, 'base64').toString('ascii') : key;
}

function createBasicAuth(user, password) {
  const base64encodedData = Buffer.from(user + ':' + password).toString('base64');
  return `Basic ${base64encodedData}`;
}

function extractEnv() {
  const ENVIRONMENTS = process.argv.find((arg) => arg?.['ENVIRONMENTS'])?.['ENVIRONMENTS'];
  return { ENVIRONMENTS };
}

function getEnv(useEnvMaster, environmentArg) {
  const { baseAppPath } = corePaths;
  const ecosystemPath = `${baseAppPath}/ecosystem.yaml`;
  const ecosystem = yaml.load(ecosystemPath);
  let environment = useEnvMaster ? ecosystem.apps[0]['env']['NODE_ENV'] : environmentArg;
  environment = !environment ? ecosystem.apps[0]['env']['NODE_ENV'] : environment;
  environment = !environment ? process.env['NODE_ENV'] : environment;
  environment = !environment ? process.env.npm_config_NODE_ENV : environment;

  let argGen = process.argv.find(arg => arg.includes?.('generator'));

  const env_ecosystem = ecosystem.apps[0][`env_${environment}`];
  const CORS_HEADER = [...ecosystem.apps[0]['env']['CORS_HEADER']];

  const corsOptions = {
    urls: [...CORS_HEADER],
    origin: ["'*'"],
  };

  if (!env_ecosystem) {
    console.log('Erro Fatal: Não foi encontrada a variável de ambiente environment:', environment);
    if (process.env['NODE_ENV'] !== 'test') {
      process.exit(0);
    }
  }

  let SERVICES = [];

  env_ecosystem.SERVICES.forEach((SERVICE) => {
    if (SERVICE.ACTIVE) {
      const user = decrypt(SERVICE.CREDENTIALS_USER, SERVICE.IS_DECRYPT);
      const pass = decrypt(SERVICE.CREDENTIALS_PASS, SERVICE.IS_DECRYPT);
      const header = createBasicAuth(user, pass);
      const url = SERVICE.URL;
      const name = Object.keys(SERVICE)[0];
      SERVICES.push({ name, url, header });
    }
  });

  const mocks = {};

  const ENVIRONMENTS = {
    NODE_ENV: environment,
    GQL_MOCK: parseInt(env_ecosystem.GQL_MOCK),
    mocks,
    GQL_PORT: parseInt(env_ecosystem.GQL_PORT),
    GQL_PATH: env_ecosystem.GQL_PATH,
    GQL_API: env_ecosystem.GQL_API,
    GQL_ENDPOINT: env_ecosystem.GQL_ENDPOINT,
    GQL_HEALTH: env_ecosystem.GQL_HEALTH,
    SERVICES,
    CORS_HEADER: corsOptions,
    CORE_PATHS: require('../core/paths').paths,
    GENERATOR: argGen
  };

  const isContain = Object.keys(process.argv).find((key) => process.argv[key]?.['ENVIRONMENTS']);
  if (!isContain) {
    process.argv.push({ ENVIRONMENTS });
  } else {
    Object.keys(process.argv).forEach((key) => {
      if (process.argv[key]?.['ENVIRONMENTS']) {
        process.argv[key]['ENVIRONMENTS'] = ENVIRONMENTS;
      }
    });
  }

  return { ENVIRONMENTS };
}

module.exports.getEnv = getEnv;
module.exports.decrypt = decrypt;
module.exports.extractEnv = extractEnv;
module.exports.createBasicAuth = createBasicAuth;
