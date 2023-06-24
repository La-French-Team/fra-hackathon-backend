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

  fastify.post('/actions/initialize-user-data', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();
      
      await hackathon.initData(jwt.email);
    }
  });
  
  fastify.post('/actions/delete-user-data', {
    handler: async (req, reply) => {
      const jwt = await req.jwtDecode();

      await hackathon.deleteData(jwt.email);
    }
  });

  // TODO delete LO event by ID to add
}
