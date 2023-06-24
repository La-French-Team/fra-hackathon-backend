import got from 'got';

/**
 * 
 * @param {SDLServerOptions} serverOptions 
 * @param {import('got').SearchParameters} [searchParams] 
 * @returns {import('got').Options}
 */
function getGotOptions(serverOptions, searchParams = {}) {
	return {
		prefixUrl: `${serverOptions.host}/`,
		// FIXME no auth for now
		// headers: {
		// 	Authorization: `Bearer ${serverOptions.apiKey}`
		// },
		agent: {
			http: serverOptions.httpAgent,
			https: serverOptions.httpsAgent
		},
    headers: {
      'content-type': 'application/ld+json'
    },
		searchParams
	}
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {string} id
 * @returns {Promise<import('http-requests-runner').coreEngineService.Response>}
 */
export async function getLO(serverOptions, id) {
	try {
		/** @type {import('got').Response} */
    const response = await got.get(
      `logistics-objects/${id}`,
      getGotOptions(serverOptions)
    );

		return {
			status: response.statusCode,
      headers: response.headers,
      body: response.body ? JSON.parse(response.body) : response.body,
      request: {
        method: response.request.options.method,
        url: response.request.options.url.href,
        headers: response.request.options.headers,
        body: response.request.options.body
      }
		};
	} catch (error) {
		throw error;
	}
}

/**
 * The LO Id can be provided as `@id` in the request body. It is generated if not provided.
 * 
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {Object} data 
 * @returns {Promise<import('http-requests-runner').coreEngineService.Response>}
 */
export async function createLO(serverOptions, data) {
	const requestOptions = getGotOptions(serverOptions);
  requestOptions.json = data;
	try {
		/** @type {import('got').Response} */
    const response = await got.post(
      `logistics-objects`,
      requestOptions
    );

		return {
			status: response.statusCode,
      headers: response.headers,
      body: response.body ? JSON.parse(response.body) : response.body,
      request: {
        method: response.request.options.method,
        url: response.request.options.url.href,
        headers: response.request.options.headers,
        body: response.request.options.body
      }
		};
	} catch (error) {
		throw error;
	}
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {string} id
 * @returns {Promise<import('http-requests-runner').coreEngineService.Response>}
 */
export async function deleteLO(serverOptions, id) {
	try {
		/** @type {import('got').Response} */
    const response = await got.delete(
      `logistics-objects/${id}`,
      getGotOptions(serverOptions)
    );

		return {
      status: response.statusCode,
      headers: response.headers,
      body: response.body ? JSON.parse(response.body) : response.body,
      request: {
        method: response.request.options.method,
        url: response.request.options.url.href,
        headers: response.request.options.headers,
        body: response.request.options.body
      }
    };
	} catch (error) {
		throw error;
	}
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {string} loId
 * @param {Object} data 
 * @param {string} [id] 
 * @returns {Promise<import('http-requests-runner').coreEngineService.Response>}
 */
export async function createLOEvent(serverOptions, loId, data, id) {
	const requestOptions = getGotOptions(serverOptions, { id });
  requestOptions.json = data;
	
	try {
		/** @type {import('got').Response} */
    const response = await got.post(
      `logistics-objects/${loId}/logistics-events`,
      requestOptions
    );

		return {
      status: response.statusCode,
      headers: response.headers,
      body: response.body ? JSON.parse(response.body) : response.body,
      request: {
        method: response.request.options.method,
        url: response.request.options.url.href,
        headers: response.request.options.headers,
        body: response.request.options.body
      }
    };
	} catch (error) {
		throw error;
	}
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {string} loId
 * @param {Object} data 
 * @param {string} [id] 
 * @returns {Promise<import('http-requests-runner').coreEngineService.Response>}
 */
export async function deleteLOEvent(serverOptions, loId, id) {
	try {
		/** @type {import('got').Response} */
    const response = await got.delete(
      `logistics-objects/${loId}/logistics-events/${id}`,
      getGotOptions(serverOptions)
    );

		return {
      status: response.statusCode,
      headers: response.headers,
      body: response.body ? JSON.parse(response.body) : response.body,
      request: {
        method: response.request.options.method,
        url: response.request.options.url.href,
        headers: response.request.options.headers,
        body: response.request.options.body
      }
    };
	} catch (error) {
		throw error;
	}
}