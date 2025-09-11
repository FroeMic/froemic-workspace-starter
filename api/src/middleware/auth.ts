import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getCookie } from 'hono/cookie';
import { validateSession, type AuthUser } from '../lib/auth.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'session');
  
  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  
  const user = await validateSession(token);
  
  if (!user) {
    throw new HTTPException(401, { message: 'Invalid session' });
  }
  
  c.set('user', user);
  await next();
}

export async function optionalAuthMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'session');
  
  if (token) {
    const user = await validateSession(token);
    if (user) {
      c.set('user', user);
    }
  }
  
  await next();
}