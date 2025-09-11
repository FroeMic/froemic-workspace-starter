import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { createUser, getUserByEmail, verifyPassword, createSession, deleteSession } from '../../lib/auth.js';
import { authMiddleware } from '../../middleware/auth.js';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authApiRoutes = [
  registerApiRoute('/auth/register', {
    method: 'POST',
    handler: async (c) => {
      const body = await c.req.json();
      const { email, password } = authSchema.parse(body);
      
      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new HTTPException(409, { message: 'User already exists' });
      }
      
      try {
        // Create user
        const user = await createUser(email, password);
        
        // Create session
        const token = await createSession(user.id);
        
        // Set httpOnly cookie
        setCookie(c, 'session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        });
        
        return c.json({ 
          user: {
            id: user.id,
            email: user.email,
          }
        });
      } catch (error) {
        console.error('Registration error:', error);
        throw new HTTPException(500, { message: 'Failed to create user' });
      }
    },
  }),

  registerApiRoute('/auth/login', {
    method: 'POST',
    handler: async (c) => {
      const body = await c.req.json();
      const { email, password } = authSchema.parse(body);
      
      // Get user by email
      const user = await getUserByEmail(email);
      if (!user) {
        throw new HTTPException(401, { message: 'Invalid credentials' });
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new HTTPException(401, { message: 'Invalid credentials' });
      }
      
      try {
        // Create session
        const token = await createSession(user.id);
        
        // Set httpOnly cookie
        setCookie(c, 'session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
        });
        
        return c.json({ 
          user: {
            id: user.id,
            email: user.email,
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        throw new HTTPException(500, { message: 'Failed to create session' });
      }
    },
  }),

  registerApiRoute('/auth/logout', {
    method: 'POST',
    middleware: [ authMiddleware],
    handler: async (c) => {
      const token = c.req.header('cookie')?.split('session=')[1]?.split(';')[0];
      
      if (token) {
        await deleteSession(token);
      }
      
      deleteCookie(c, 'session', {
        path: '/',
      });
      
      return c.json({ message: 'Logged out successfully' });
    },
  }),

  registerApiRoute('/auth/me', {
    method: 'GET',
    middleware: [authMiddleware],
    handler: async (c) => {
      const user = c.get('user');
      return c.json({ user });
    },
  }),
];