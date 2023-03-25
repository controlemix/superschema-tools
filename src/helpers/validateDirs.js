const { createDir, writeFile, directoryExists, fileExists } = require("./fs");
const path = require('path');
const sequence = require('promise-sequence/lib/sequence');
const { typeDefsMock } = require("./constantsFn");

const genListDirectoriesDefault = (pathBase) => [
  { task: createDir, tag: 'gql', target: 'src/schema/gql', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
  { task: createDir, tag: 'gql/subgraphs', target: 'src/schema/gql/subgraphs', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql/subgraphs'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
  { task: createDir, tag: 'gql/subgraphs/frags', target: 'src/schema/gql/subgraphs/frags', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql/subgraphs/frags'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
  { task: createDir, tag: 'gql/subgraphs/frags/operations', target: 'src/schema/gql/subgraphs/frags/operations', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql/subgraphs/frags/operations'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
  { task: createDir, tag: 'gql/subgraphs/frags/sdl', target: 'src/schema/gql/subgraphs/frags/sdl', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql/subgraphs/frags/sdl'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
  { task: createDir, tag: 'gql/supergraph', target: 'src/schema/gql/supergraph', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql/supergraph'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
  { task: createDir, tag: 'gql/supergraph/operations', target: 'src/schema/gql/supergraph/operations', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql/supergraph/operations'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
  { task: createDir, tag: 'gql/supergraph/sdl', target: 'src/schema/gql/supergraph/sdl', type: 'D', data: undefined, path: path.join(pathBase, '/src/schema/gql/supergraph/sdl'), from: undefined, to: undefined, force: true, skip: false, isExist: false },
];

async function checkDirectoriesDefault(pathBase) {
  const jobsDir = genListDirectoriesDefault(pathBase);
  await sequence(
    jobsDir.map((job) => async () => {
      if (job) {
        const { path } = job;
        const isExist = await directoryExists(path);
        job.isExist = isExist;
      }
    }));
  return jobsDir;
}

async function checkDirectoriesServices(pathBase, services) {
  const jobsServicesDir = [];
  services.forEach((service) => {
    const name = service.name.toLowerCase();
    jobsServicesDir.push({ task: createDir, tag: `gql/subgraphs/${name}`, target: `src/schema/gql/subgraphs/${name}`, type: `D`, data: undefined, path: path.join(pathBase, `/src/schema/gql/subgraphs/${name}`), from: undefined, to: undefined, force: true, skip: false, isExist: false },);
    jobsServicesDir.push({ task: createDir, tag: `gql/subgraphs/${name}/operations`, target: `src/schema/gql/subgraphs/${name}/operations`, type: `D`, data: undefined, path: path.join(pathBase, `/src/schema/gql/subgraphs/${name}/operations`), from: undefined, to: undefined, force: true, skip: false, isExist: false },);
    jobsServicesDir.push({ task: createDir, tag: `gql/subgraphs/${name}/sdl`, target: `src/schema/gql/subgraphs/${name}/sdl`, type: `D`, data: undefined, path: path.join(pathBase, `/src/schema/gql/subgraphs/${name}/sdl`), from: undefined, to: undefined, force: true, skip: false, isExist: false },);
  });

  await sequence(
    jobsServicesDir.map((job) => async () => {
      if (job) {
        const { path } = job;
        const isExist = await directoryExists(path);
        job.isExist = isExist;
      }
    }));

  return jobsServicesDir;
}

async function checkTypeDefServices(pathBase, services) {
  const jobsServicesTypeDefs = [];
  services.forEach((service) => {
    const name = service.name.toLowerCase();
    jobsServicesTypeDefs.push({ task: writeFile, tag: `gql/subgraphs/${name}/sdl/typeDefs.graphql`, target: `src/schema/gql/subgraphs/${name}/sdl/typeDefs.graphql`, type: `F`, data: typeDefsMock(name), path: path.join(pathBase, `/src/schema/gql/subgraphs/${name}/sdl/typeDefs.graphql`), from: undefined, to: undefined, force: true, skip: false, isExist: false },);
    // jobsServicesTypeDefs.push({ task: writeFile, tag: `gql/subgraphs/frags/sdl/typeDefs.graphql`, target: `src/schema/gql/subgraphs/frags/sdl/typeDefs.graphql`, type: `F`, data: typeDefsMock(name), path: path.join(pathBase, `/src/schema/gql/subgraphs/frags/sdl/typeDefs.graphql`), from: undefined, to: undefined, force: true, skip: false, isExist: false },);
  });

  await sequence(
    jobsServicesTypeDefs.map((job) => async () => {
      if (job) {
        const { path } = job;
        const isExist = await fileExists(path);
        job.isExist = isExist;
      }
    }));

  return jobsServicesTypeDefs;
}

async function createDirectories(jobsDir) {
  await sequence(
    jobsDir.map((job) => async () => {
      if (job) {
        const { task, isExist, path } = job;
        if (!isExist) { await task(path) }
      }
    })
  );
}

async function createTypeDefs(jobsDir) {
  await sequence(
    jobsDir.map((job) => async () => {
      if (job) {
        const { task, isExist, path, data } = job;
        if (!isExist) { await task(path, data) }
      }
    })
  );
}

async function validateDirs(pathBase, services) {
  
  const jobsDir = await checkDirectoriesDefault(pathBase);
  await createDirectories(jobsDir);
  
  const jobsServicesDir = await checkDirectoriesServices(pathBase, services);
  await createDirectories(jobsServicesDir);

  const jobsServicesTypes = await checkTypeDefServices(pathBase, services);
  await createTypeDefs(jobsServicesTypes);
}


module.exports.validateDirs = validateDirs;
