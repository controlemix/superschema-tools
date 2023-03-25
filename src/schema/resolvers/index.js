const { resolvers } = require('../../core/paths').paths.baseAppPaths;
const { helpers } = require('../../core/paths').paths.baseModPaths;

const getListResolvers =  () => {
  const { lowerCaseFirstLetter } = require(`${helpers}/constantsFn`);  
  const listResolvers = [];  
  require('fs').readdirSync(resolvers + '/').forEach(function(file) {
      if (file.match(/\.js$/) !== null && file !== 'index.js' ) {
        const name = lowerCaseFirstLetter(file.replace('.js', ''));
        const resolver = require(resolvers + '/' + file)[name+'Resolver'];
        listResolvers.push({resolver})
      }
  });
  return {listResolvers}
};
module.exports = { getListResolvers };