import * as hackathon from '../../hackathon/data.js';

/**
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {import('fastify').RouteShorthandOptions} options 
 */
export async function hackathonRoutes(fastify, options) {
  // await fastify.register(import('@fastify/rate-limit'), {
  //   max: process.env.HACKATHON_RATELIMIT_MAX_PER_MINUTE || 1000,
  //   timeWindow: '1 minute'
  // });
  fastify.post('/actions/init', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();
      return await hackathon.init(jwt.payload.email);
    }
  })

  fastify.post('/actions/current', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();
      return await hackathon.current(jwt.payload.email);
    }
  })

  fastify.post('/actions/nextStep', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();
      return await hackathon.nextStep(jwt.payload.email);
    }
  });
  
  fastify.post('/actions/reset', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();

      await hackathon.reset(jwt.payload.email);
    }
  });

  // TODO delete LO event by ID to add
}
