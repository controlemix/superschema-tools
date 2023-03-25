const sequence = require('promise-sequence/lib/sequence');
const clc = require('cli-color');

function operationsJob(detailSchemas, NODE_ENV) {
    return new Promise(async (resolve, _reject) => {
        const subschemas = [];
        const listOperations = [];
        const listOperationFrag = [];
        const task = require("../utils/schemaOperation").operationBuilder;

        detailSchemas.forEach((detailSchema) => {
            const { schema, name, executor } = detailSchema;
            subschemas.push({ schema, executor });
            listOperations.push({ task, schema, name });
        });

        listOperationFrag.push({ task: require("../utils/schemaOperation").operationBuilderFrag, schema: require('@graphql-tools/stitch').stitchSchemas({ subschemas }) });
        console.log(clc.blueBright('-------------------------------------'));
        console.log('');
        console.log(clc.cyanBright('generating operations default for services, working please await...'));

        await sequence(
            listOperations.map((job) => async () => {
                if (job) {
                    const { task, schema, name } = job;
                    await task(schema, name, NODE_ENV);
                }
            }),


        );
        console.log('');
        console.log(clc.greenBright('generating operations Frag for services, working please await...'));
        await sequence(

            listOperationFrag.map((job) => async () => {
                if (job) {
                    const { task, schema } = job;
                    await task(schema, NODE_ENV);
                }
            }),
        );
        console.log('');
        console.log('job done!');
        console.log(clc.blueBright('-------------------------------------'));
        resolve({ success: true });
    });
}

function operationsSuperJob(schema, NODE_ENV) {
    return new Promise(async (resolve, _reject) => {
        const listOperationSuper = [];
        const task = require("../utils/schemaOperation").operationBuilderSuper;
        listOperationSuper.push({ task, schema });
    
        console.log(clc.magentaBright('-------------------------------------'));
        console.log('');
        console.log(clc.yellowBright('generating operations All, working please await...'));

        await sequence(
            listOperationSuper.map((job) => async () => {
                if (job) {
                    const { task, schema } = job;
                    await task(schema, NODE_ENV);
                }
            }),
        );
        console.log('');
        console.log('job done!');
        console.log(clc.magentaBright('-------------------------------------'));
        resolve({ success: true });
    });
}

module.exports.operationsJob = operationsJob;
module.exports.operationsSuperJob = operationsSuperJob;