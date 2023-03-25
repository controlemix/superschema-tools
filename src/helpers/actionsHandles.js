const tx2 = require('tx2');
const clc = require('cli-color');

tx2.on('RESTART_APP', function(NODE_ENV) {
  exit(NODE_ENV);
});

tx2.on('SIGINT', function(NODE_ENV) {
  exit(NODE_ENV);
});

tx2.on('KILL', function(NODE_ENV) {
  exit(NODE_ENV);
});

tx2.on('READY', function(_param) {
  const {GQL_ENDPOINT, NODE_ENV, SERVICES, PATH} = _param;
  process?.send?.('ready');
  console.log(clc.cyan(`\n\n------------------  info  -----------------------`));
  console.log(clc.cyan(`-------------------------------------------------\n`));  
  console.log(`Server: Apollo Federated V2 is ready`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(clc.cyanBright(`\n---------------  supergraph  --------------------\n`));
  console.log(`Service: API GATEWAY `);
  console.log(`PathGQL: ${PATH}${GQL_ENDPOINT}`);
  console.log(clc.cyanBright(`\n----------------  subgraphs  --------------------`));
  SERVICES.forEach(service => {
    const {isGetRemoteSdl, name,  url} = service;
    if(isGetRemoteSdl){
      console.log(clc.greenBright(`\nService: [online]  API ${name}`));
      console.log(clc.greenBright(`PathGQL: ${url}`));
    }else{
      console.log(clc.redBright(`\nService: [offline] API ${name}`));
      console.log(clc.redBright(`PathGQL: ${url}`));
    }
  });
  console.log(clc.cyan(`\n-------------------------------------------------`));
  console.log(clc.cyan(`-------------------------------------------------\n\n`));
});

tx2.on('PROCESS_LOG', function(param) {
  console.log({
    result: param.result,
    code: param.code,
    command: param.command,
    message: param.message,
    stack: param.stack,
  });
});
function exit(_NODE_ENV) {
  console.log(`\n---------  info  ------------\n\nRequest stop incoming API Environment: ${_NODE_ENV} exiting now!\n\n-----------------------------\n`);
  if(_NODE_ENV!=='test'){
    setTimeout(() => {
      process.exit(0);
    },10000);
  }
}

module.exports.exit = exit;
module.exports.tx2 = tx2;
