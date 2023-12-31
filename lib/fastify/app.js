import * as fastifyCors from '@fastify/cors';
import * as fastifyHttpProxy from '@fastify/http-proxy';
import * as fastifyJwt from '@fastify/jwt';
import * as fastifySensible from '@fastify/sensible';
import * as fastifyUnderPressure from '@fastify/under-pressure';

import { getJwk } from './helpers/getJwk.js';
import { hackathonRoutes } from './routes/hackathon.js';
import { healthzRoutes } from './routes/healthz.js';

/**
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {import('fastify').RouteShorthandOptions} options 
 */
export async function app(fastify, options) {
  await fastify.register(fastifyUnderPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 1000000000,
    maxRssBytes: 1000000000,
    maxEventLoopUtilization: 0.98,
    exposeStatusRoute: '/statusz'
  });
  
  fastify.register(fastifySensible);

  await fastify.register(fastifyCors, {
  });

  await fastify.register(fastifyJwt, {
    decode: { complete: true },
    jwtDecode: true,
    secret: getJwk,
  });

  await fastify.register(healthzRoutes, {
    prefix: ''
  });

  await fastify.register(hackathonRoutes, {
    prefix: '/hackathon'
  });

  await fastify.register(fastifyHttpProxy, {
    upstream: 'https://sdl.onerecord.fr',
    prefix: '/sdl',
    httpMethods: ['GET', 'OPTIONS'],
    replyOptions: {
      rewriteRequestHeaders: (originalRequest, headers) => {
        console.log(process.env)
        return {
          ...headers,
          'Authorization': `Bearer ${process.env.SDL_API_KEY}`
        }
      }
    }
  });
  // TODO transform response body with proper links...

  await fastify.register(fastifyHttpProxy, {
    upstream: 'https://neone.onerecord.fr',
    prefix: '/neone',
    httpMethods: ['GET', 'OPTIONS']
  });
}
