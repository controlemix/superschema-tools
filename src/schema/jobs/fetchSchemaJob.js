const fetch = require('node-fetch');
const { createDir, writeFile, directoryExists, fileExists, readFile } = require('../../helpers/fs');
const path = require('path');
const sequence = require('promise-sequence/lib/sequence');

const fetchSDL = async (url, header) => new Promise(async (resolve, reject) => {
    const query = 'query _service { _service { sdl } }';
    const variables = '{}';
    try {
        const result = await fetch(url, {
            method: 'POST',
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${header}`,
            },
            body: JSON.stringify({ query, variables }),
        });
        const sdlGet = await result.json();
        const sdl = sdlGet['data']._service.sdl
        resolve({ sdl, error: false });
    } catch (error) {
        resolve({ sdl: null, error: true });
    }

});


async function fetchRemoteList(pathBase, services) {
    const jobsFetchRemoteList = [];
    services.forEach((service) => {
        const { name, url, header } = service;
        jobsFetchRemoteList.push({ task: fetchSDL, name, url, header, path: path.join(pathBase, `/src/schema/gql/subgraphs/${name.toLowerCase()}`, '/sdl/typeDefs.graphql'), isGetRemoteSdl: false, sdlRemoteData: undefined, isSaveRemoteSdl: false, isGetLocalSdl: false, sdlLocalData: undefined });
    });

    await sequence(
        jobsFetchRemoteList.map((job) => async () => {
            if (job) {
                const { path } = job;
                const isExist = await fileExists(path);
                if (isExist) {
                    job.sdlLocalData = await readFile(path, 'utf8');
                    job.isGetLocalSdl = true;
                }
            }
        }));

    return jobsFetchRemoteList;
}


async function startFetchSchemaJob(pathBase, services) {

    const jobsFetchRemoteList = await fetchRemoteList(pathBase, services);

    await sequence(
        jobsFetchRemoteList.map((job) => async () => {
            if (job) {
                const { url, header, path, task } = job;
                const { sdl, error } = await task(url, header);
                if (!error) {
                    job.sdlRemoteData = sdl;
                    job.isGetRemoteSdl = true;
                    await writeFile(path, sdl, 'utf8');
                    job.isSaveRemoteSdl = true;
                } else {
                    job.isGetRemoteSdl = false;
                    job.isSaveRemoteSdl = false;
                }
            }
        }));

    return jobsFetchRemoteList;
}

async function fetchSchemaJob(pathBase, services) {
    const listSdl = await startFetchSchemaJob(pathBase, services);
    return listSdl;
}

module.exports.fetchSchemaJob = fetchSchemaJob;