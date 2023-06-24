import * as fs from 'fs';
import * as sdlHttpRequestsRunner from 'http-requests-runner';
import * as https from 'https';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as sdlService from '../core-engine/sdl.service.js';
import * as neoneHttpRequestsRunner from '../neone/request-runner.js';
import got from 'got';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('http-requests-runner').coreEngineService.SDLServerOptions} */
const sdlServerOptions = () => {
  return {
    host: process.env.SDL_HOST,
    apiKey: process.env.SDL_API_KEY,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  }
};

/** @type {import('http-requests-runner').coreEngineService.SDLServerOptions} */
const neoneServerOptions = () => {
  return {
    host: process.env.NEONE_HOST,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  }
}

export const cache = {
  dataByUserId: {}
};

/**
 * @param {string} userId any unique key for prefixing IDs, ideally a userId
 * @param {string} sdlResourceName same as filename of JSON file containing SDL requests groups
 * @returns {import('http-requests-runner').RequestGroup[]}
 */
function getSDLRequestGroupsByUserId(userId, sdlResourceName) {
  if (!cache.dataByUserId[userId]) {
    cache.dataByUserId[userId] = {};
  }
  if (!cache.dataByUserId[userId][sdlResourceName]) {
    // FIXME use a param to configure base file path
    const filepath = path.join(__dirname, 'scenario', `${sdlResourceName}.json`)
    const sdlDataRequestGroupsText = fs.readFileSync(filepath, { encoding: 'utf-8' });

    // suffix all links by userId and parse
    /** @type {import('http-requests-runner').RequestGroup[]} */
    const sdlDataRequestGroups = JSON.parse(
      sdlDataRequestGroupsText.replaceAll(/"(\{geodis\}\/tenants\/[^"]*)"/gm, `"$1_${userId}"`)
    );

    for (const requestGroup of sdlDataRequestGroups) {
      for (const request of requestGroup.requests) {
        // suffix ids
        if (request.params && request.params.id) {
          request.params.id = `${request.params.id}_${userId}`;
        }
        if (request.loId) {
          request.loId = `${request.loId}_${userId}`;
        }
      }
    }

    cache.dataByUserId[userId][sdlResourceName] = sdlDataRequestGroups;
  }

  return cache.dataByUserId[userId][sdlResourceName];
}

/**
 * @param {string} userId any unique key for prefixing IDs, ideally a userId
 * @param {string} neoneResourceName same as filename of JSON file containing NE:ONE requests groups
 * @returns {import('http-requests-runner').RequestGroup[]}
 */
function getNEONERequestGroupsByUserId(userId, neoneResourceName) {
  if (!cache.dataByUserId[userId]) {
    cache.dataByUserId[userId] = {};
  }
  if (!cache.dataByUserId[userId][neoneResourceName]) {
    const neoneDataRequestGroupsText = fs.readFileSync(path.join(__dirname, 'neone-resources', `${neoneResourceName}.json`), { encoding: 'utf-8' });

    // suffix all links by userId and parse
    /** @type {import('http-requests-runner').RequestGroup[]} */
    const neoneDataRequestGroups = JSON.parse(
      neoneDataRequestGroupsText.replaceAll(/"(https:\/\/neone.onerecord.fr\/logistics-objects\/[^"]*)"/gm, `"$1_${userId}"`)
    );

    for (const requestGroup of neoneDataRequestGroups) {
      for (const request of requestGroup.requests) {
        // suffix ids
        if (request.params && request.params.id) {
          request.params.id = `${request.params.id}_${userId}`;
        }
        if (request.loId) {
          request.loId = `${request.loId}_${userId}`;
        }
      }
    }

    cache.dataByUserId[userId][neoneResourceName] = neoneDataRequestGroups;
  }

  return cache.dataByUserId[userId][neoneResourceName];
}

/**
 * @param {string} userId 
 */
export async function initData(userId) {
  await neoneHttpRequestsRunner.run(neoneServerOptions(), getNEONERequestGroupsByUserId(userId, 'initNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions(), getSDLRequestGroupsByUserId(userId, 'initSDLData'));
}

/**
 * @param {string} userId 
*/
export async function deleteData(userId) {
  await neoneHttpRequestsRunner.run(neoneServerOptions(), getNEONERequestGroupsByUserId(userId, 'deleteNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions(), getSDLRequestGroupsByUserId(userId, 'deleteSDLData'));
}

/**
 * @param {string} userId 
 */
export async function reinitData(userId) {
  await neoneHttpRequestsRunner.run(neoneServerOptions(), getNEONERequestGroupsByUserId(userId, 'deleteNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions(), getSDLRequestGroupsByUserId(userId, 'deleteSDLData'));

  await neoneHttpRequestsRunner.run(neoneServerOptions(), getNEONERequestGroupsByUserId(userId, 'initNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions(), getSDLRequestGroupsByUserId(userId, 'initSDLData'));
}

/**
 * @param {string} userId 
 */
export async function addEvents(userId) {
  await neoneHttpRequestsRunner.run(neoneServerOptions(), getNEONERequestGroupsByUserId(userId, 'addNeONEEvents'));
  // FIXME VERY SLOW
  // await sdlHttpRequestsRunner.run(sdlServerOptions(), getSDLRequestGroupsByUserId(userId, 'addSDLEvents'));
  await updateSDLEvents(userId);
}

/**
 * @param {string} userId 
 */
export async function updateSDLEvents(userId) {
  if (!cache.dataByUserId[userId]) {
    cache.dataByUserId[userId] = {};
  }

  if (!cache.dataByUserId[userId]['updateEvents']) {
    const sdlEventsUpdatesText = fs.readFileSync(
      path.join(__dirname, 'sdl-resources', 'events', 'updateEvents.json'),
      { encoding: 'utf-8' }
    ).replaceAll('{{USER_ID}}', userId);

    const sdlEventsUpdates = JSON.parse(sdlEventsUpdatesText);

    cache.dataByUserId[userId]['updateEvents'] = sdlEventsUpdates;
  }

  await Promise.all(cache.dataByUserId[userId]['updateEvents'].map((request) => {
    return sdlService.updateEvents(sdlServerOptions(), request.tenant, request.type, request.loId, request.events);
  }));
}

export async function getAllUserData(userId) {
  // TODO read cache and return LO and events data, sorted by LO type
  // No need to fetch information for visibility page... it will be accessible through links
  //   -> or fetch only LOs that change (during ground handling)
  // TODO use a "step" parameter ?
  // ?Ground handling part will need to fetch from NEONE server


  // search with kuzzle for getting LOs ?
}

export function currentStage(userId) {
  return cache.dataByUserId[userId].stage
}
function incrementStage(userId) {
  cache.dataByUserId[userId].stage++
  return cache.dataByUserId[userId].stage
}

export async function init(userId) {
  cache.dataByUserId[userId] = {
    stage: 0,
    currentStage: [{requests: []}]
  }

  return nextStep(userId)
}

export async function current(userId) {
  return cache.dataByUserId[userId].currentStage
}

export async function nextStep(userId) {
  const stage = incrementStage(userId)
  const resource = `step0${stage}-sdl`
  if (stage === 1 || stage === 2) {
    await sdlHttpRequestsRunner.run(sdlServerOptions(), getSDLRequestGroupsByUserId(userId, resource));
  } else if (stage === 3) {
    const requestGroups = getSDLRequestGroupsByUserId(userId, resource);
    const requestGroupsWithoutEvents = [{
      "parallel": false,
      "requests": requestGroups[0].requests.filter(r => r.action !== 'create_event')
    }];
    await sdlHttpRequestsRunner.run(sdlServerOptions(), requestGroupsWithoutEvents);

    const eventsByLO = requestGroups[0].requests.filter(r => r.action === 'create_event').reduce((acc, request) => {
      if (!acc[request.loId]) {
        acc[request.loId] = {
          tenant: request.tenant,
          type: request.type,
          events: []
        };
      }

      acc[request.loId].events.push({
          ...request.body,
          id:  request.params.id,
          uri: `{geodis}/tenants/geodis/${sdlService.typeToResourceType[type]}/${request.loId}_${userId}/events/${request.params.id}`
        });

      return acc;
    }, {});

    for (const [loId, { tenant, type, events }] of Object.entries(eventsByLO)) {
      await sdlService.updateEvents(sdlServerOptions(), tenant, type, loId, events);
    }
  } else if (4) {
    // TODO neone
  }
    
  /**
   * @type Array
   */
  const currentRequests = cache.dataByUserId[userId].currentStage[0]?.requests
  const newRequests = cache.dataByUserId[userId][resource][0].requests
  for(const newRequest of newRequests) {
    if(newRequest.action === "update_lo") {
      const id = newRequest.loId
      const toBeUpdated = currentRequests.find(req => req.action === "create_lo" && req?.params?.id === id)
      if(toBeUpdated) {
        toBeUpdated.body = newRequest.body
      }
    } else {
      currentRequests.push(newRequest)
    }
  }

  // cache.dataByUserId[userId].currentStage = cache.dataByUserId[userId][resource]
  

  return cache.dataByUserId[userId].currentStage
}

export async function reset(userId) {
  cache.dataByUserId[userId] = {}
  await sdlHttpRequestsRunner.run(sdlServerOptions(), getSDLRequestGroupsByUserId(userId, 'delete-sdl'));
  return cache.dataByUserId[userId]['delete-sdl']
}
