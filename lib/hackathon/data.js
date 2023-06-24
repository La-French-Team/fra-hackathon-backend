import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';
import * as sdlHttpRequestsRunner from 'http-requests-runner';
import * as sdlService from '../core-engine/sdl.service.js';
import * as neoneHttpRequestsRunner from '../neone/request-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('http-requests-runner').coreEngineService.SDLServerOptions} */
const sdlServerOptions = {
  host: process.env.SDL_HOST,
  apiKey: process.env.SDL_API_KEY,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
};

/** @type {import('http-requests-runner').coreEngineService.SDLServerOptions} */
const neoneServerOptions = {
  host: process.env.NEONE_HOST,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
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
    const sdlDataRequestGroupsText = fs.readFileSync(path.join(__dirname, 'sdl-resources', `${sdlResourceName}.json`), { encoding: 'utf-8' });

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
  await neoneHttpRequestsRunner.run(neoneServerOptions, getNEONERequestGroupsByUserId(userId, 'initNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions, getSDLRequestGroupsByUserId(userId, 'initSDLData'));
}

/**
 * @param {string} userId 
*/
export async function deleteData(userId) {
  await neoneHttpRequestsRunner.run(neoneServerOptions, getNEONERequestGroupsByUserId(userId, 'deleteNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions, getSDLRequestGroupsByUserId(userId, 'deleteSDLData'));
}

/**
 * @param {string} userId 
 */
export async function reinitData(userId) {
  await neoneHttpRequestsRunner.run(neoneServerOptions, getNEONERequestGroupsByUserId(userId, 'deleteNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions, getSDLRequestGroupsByUserId(userId, 'deleteSDLData'));

  await neoneHttpRequestsRunner.run(neoneServerOptions, getNEONERequestGroupsByUserId(userId, 'initNeONEData'));
  await sdlHttpRequestsRunner.run(sdlServerOptions, getSDLRequestGroupsByUserId(userId, 'initSDLData'));
}

/**
 * @param {string} userId 
 */
export async function addEvents(userId) {
  await neoneHttpRequestsRunner.run(neoneServerOptions, getNEONERequestGroupsByUserId(userId, 'addNeONEEvents'));
  // FIXME VERY SLOW
  // await sdlHttpRequestsRunner.run(sdlServerOptions, getSDLRequestGroupsByUserId(userId, 'addSDLEvents'));
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
    return sdlService.updateEvents(sdlServerOptions, request.tenant, request.type, request.loId, request.events);
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