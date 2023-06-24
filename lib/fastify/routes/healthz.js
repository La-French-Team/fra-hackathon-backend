/**
 * @param {import('fastify').FastifyInstance} fastify 
 */
export async function healthzRoutes(fastify) {
  fastify.get('/healthz', {
    schema: {
      response: {
        200: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string' },
          }
        }
      }
    },
    handler: async (req, reply) => {
      reply.send({ status: 'ok' });
    }
  });
}
