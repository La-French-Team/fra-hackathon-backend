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
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      }
    },
    handler: async (req, reply) => {
      await hackathon.initData(req.query['userId']);
    }
  });
  
  fastify.post('/actions/delete-user-data', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        },
        required: ['userId']
      }
    },
    handler: async (req, reply) => {
      await hackathon.deleteData(req.query['userId']);
    }
  });

  // TODO delete LO event by ID to add
}
