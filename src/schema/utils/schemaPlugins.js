const executionPlugin = {
  async requestDidStart(operation) {
    if (operation?.request?.operationName && operation?.request?.variables && operation?.request?.variables !== {}) {
      let operationName = operation.request.operationName;
      let operationNameReceived = operation.request.operationName;
      let service = '';
      let operationQry = undefined;
      const isAll = operationName.includes('All');
      const isFrag = operationName.includes('Frag');
      if (isAll) {
        service = operationName.split('All')[0];
        service = service.toLowerCase();
        operationQry = require('./schemaOperation').getOperationSuper(operationName, operationNameReceived, service);
      } else if (isFrag) {
        service = operationName.split('Frag')[0];
        service = service.toLowerCase();
        operationQry = require('./schemaOperation').getOperation(operationName, service);
      }
      if (operationQry) {

        operation.request.query = operationQry.query;
      }
    }
  },
};

module.exports.executionPlugin = executionPlugin;