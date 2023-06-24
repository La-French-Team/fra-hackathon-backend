import * as neoneService from './neone.service.js';

/**
 * 
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {import('http-requests-runner').Request} request 
 */
function getNeoneAction(serverOptions, request) {
  switch (request.action) {
    case 'create_lo':
      return neoneService.createLO(serverOptions, request.body);
    case 'delete_lo':
      return neoneService.deleteLO(serverOptions, request.loId);
    case 'create_event':
      return neoneService.createLOEvent(serverOptions, request.loId, request.body, request?.params?.id);
    case 'delete_event':
      // FIXME event ID should not be in params, eventId property should be added to the Request type
      return neoneService.deleteLOEvent(serverOptions, request.loId, request?.params?.id);
    default:
      break;
  }
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions
 * @param {import('http-requests-runner').RequestGroup} requestGroup 
 * @returns {import('http-requests-runner').RunResponse}
 */
async function runInParallel(serverOptions, requestGroup) {
  const promises = [];
  const responses = [];
  const errors = [];

  for (const request of requestGroup.requests) {
    promises.push(getNeoneAction(serverOptions, request).then(response => {
      responses.push(response);
    }).catch(error => {
      errors.push(error);
    }));
  }

  await Promise.allSettled(promises);

  return {
    responses,
    errors
  }
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions
 * @param {import('http-requests-runner').RequestGroup} requestGroup 
 * @returns {import('http-requests-runner').RunResponse}
 */
async function runSequentially(serverOptions, requestGroup) {
  const responses = [];
  const errors = [];

  for (const request of requestGroup.requests) {
    try {
      const response = await getNeoneAction(serverOptions, request);
      responses.push(response);
    } catch (error) {
      errors.push(error);
    }
  }

  return {
    responses,
    errors
  }
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions
 * @param {Array<import('http-requests-runner').RequestGroup>} requestGroups
 */
export async function run(serverOptions, requestGroups) {
  const responseGroups = [];
  const errorGroups = [];
  let hasErrors = false;

  for (const requestGroup of requestGroups) {
    /** @type {import('http-requests-runner').RunResponse} */
    let runResponse;
    if (requestGroup.parallel) {
      runResponse = await runInParallel(serverOptions, requestGroup);
    } else {
      runResponse = await runSequentially(serverOptions, requestGroup);
    }

    errorGroups.push(runResponse.errors);
    if (runResponse.errors.length > 0) {
      hasErrors = true;
    }
    responseGroups.push(runResponse.responses);
  }

  if (hasErrors) {
    throw errorGroups;
  }
  return responseGroups;
}