const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);


const readFile = (path, opts = 'utf8') =>
  new Promise((resolve, reject) => require('fs').readFile(path, opts, (err, data) => (err ? reject(err) : resolve(data))));
const writeFile = (path, data, opts = 'utf8') =>
  new Promise((resolve, reject) => require('fs').writeFile(path, data, opts, (err) => (err ? reject(err) : resolve(true))));
const createOperations = (command, NODE_ENV) => {
  let isShell = NODE_ENV !== 'test' ? true : false;
  require('child_process').spawnSync('gqlg  ' + command, { shell: isShell });
  return true;
};
const removeOperationsFrag = (NODE_ENV, servicesList) => {
  let command = ' -rf ./src/schema/gql/subgraphs/frags/operations/*';
  let isShell = NODE_ENV !== 'test' ? false : true;  

  require('child_process').spawnSync('rm  ' + command, { shell: isShell });

  command = ' -rf ./src/schema/gql/subgraphs/product/operations/*';
  require('child_process').spawnSync('rm  ' + command, { shell: isShell });

  servicesList.forEach(service => {
    if( checkFileExists(`./src/schema/gql/subgraphs/${service}/operations/index.js`)){
      command = ` -rf ./src/schema/gql/subgraphs/${service}/operations/*`;
      require('child_process').spawnSync('rm  ' + command, { shell: isShell });    
  }
      
  });  

  command = ' -rf ./src/schema/gql/supergraph/operations/*';
  require('child_process').spawnSync('rm  ' + command, { shell: isShell });

  return true;
};

function checkFileExists(filepath) {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.constants.F_OK, (error) => {
      resolve(!error);
    });
  });
}

module.exports.createOperations = createOperations;
module.exports.removeOperationsFrag = removeOperationsFrag;
module.exports.writeFile = writeFile;
module.exports.readFile = readFile;
module.exports.checkFileExists = checkFileExists;
module.exports.exec = exec;
