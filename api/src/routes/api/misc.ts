import { registerApiRoute } from '@mastra/core/server';
import { validateSession } from '../../lib/auth.js';
import { corsMiddleware } from '../../middleware/cors.js';

export const miscApiRoutes = [
  // Health check
  registerApiRoute('/health', {
    method: 'GET',
    middleware: [corsMiddleware],
    handler: async (c) => c.json({ status: 'ok' }),
  }),

  // ElectricSQL proxy-auth endpoint
  registerApiRoute('/electric/auth', {
    method: 'GET',
    handler: async (c) => {
      const token = c.req.header('cookie')?.split('session=')[1]?.split(';')[0];
      
      if (!token) {
        return c.json({ error: 'No session token' }, 401);
      }
      
      const user = await validateSession(token);
      
      if (!user) {
        return c.json({ error: 'Invalid session' }, 401);
      }
      
      return c.json({ 
        user_id: user.id,
        email: user.email 
      });
    },
  }),
];