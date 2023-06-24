import got from 'got';

/** @type {Object<string, string>} */
export const typeToResourceType = {
  AccessControlList: 'access-control-lists',
  Activity: 'activities',
  BookingRequest: 'booking-requests',
  ChangeMode: 'change-modes',
  ChangeRequest: 'change-requests',
  Consignment: 'consignments',
  Consumer: 'consumers',
  CustomerOrder: 'customer-orders',
  Event: 'events',
  ExecutionPlan: 'execution-plans',
  HumanMean: 'human-means',
  InvoicingDocument: 'invoicing-documents',
  Issues: 'issues',
  Item: 'items',
  MaterialMean: 'material-means',
  Operation: 'operations',
  Piece: 'pieces',
  Product: 'products',
  ServiceLevelAgreement: 'service-level-agreements',
  ServiceRequest: 'service-requests',
  Service: 'services',
  Subscription: 'subscriptions'
};

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {string} tenant
 * @param {import('got').SearchParameters} [searchParams] 
 * @returns {import('got').OptionsOfTextResponseBody}
 */
function getGotOptions(serverOptions, tenant, searchParams = {}) {
  return {
    prefixUrl: `${serverOptions.host}/tenants/${tenant}/`,
    headers: {
      Authorization: `Bearer ${serverOptions.apiKey}`
    },
    agent: {
      http: serverOptions.httpAgent,
      https: serverOptions.httpsAgent
    },
    responseType: 'json',
    searchParams
  }
}

/**
 * @param {import('http-requests-runner').coreEngineService.SDLServerOptions} serverOptions 
 * @param {string} tenant 
 * @param {string} type 
 * @param {string} loId 
 * @param {Array<Object>} events 
 * @returns 
 */
export async function updateEvents(serverOptions, tenant, type, loId, events) {
  const requestOptions = {
    ...getGotOptions(serverOptions, tenant, {
      refresh: "wait_for",
      retryOnConflict: 3,
      source: true,
    }),
    prefixUrl: `${serverOptions.host}/`,
    json: {
      events,
    },
  }

  /** @type {import('got').Response} */
  const response = await got.patch(
    `tenant-sdl-${tenant}/${typeToResourceType[type]}/${loId}/_update`,
    requestOptions
  );

  return {
    status: response.statusCode,
    headers: response.headers,
    body: response.body,
    request: {
      method: response.request.options.method,
      url: response.request.options.url.href,
      headers: response.request.options.headers,
      body: response.request.options.body
    }
  };
}