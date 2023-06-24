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

  fastify.post('/actions/step1', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();
      
      await hackathon.step1(jwt.email);
    }
  });

  fastify.post('/actions/step2', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();
      
      await hackathon.step2(jwt.email);
    }
  });
  
  fastify.post('/actions/reset', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();

      await hackathon.reset(jwt.email);
    }
  });

  // TODO delete LO event by ID to add
}
