import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, sessions } from '../db/schema.js';
import type { User, Session } from '../db/schema.js';

import { env } from './env.js';

const JWT_SECRET = env.JWT_SECRET;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthUser {
  id: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(email: string, password: string): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  const [user] = await db.insert(users).values({
    email,
    passwordHash,
  }).returning();
  
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

export async function createSession(userId: string): Promise<string> {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
  
  return token;
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const [session] = await db.select().from(sessions).where(eq(sessions.token, token));
  
  if (!session) {
    return null;
  }
  
  // Check if session has expired
  if (new Date() > session.expiresAt) {
    await deleteSession(token);
    return null;
  }
  
  return session;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(eq(sessions.expiresAt, new Date()));
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const session = await getSessionByToken(token);
    
    if (!session) {
      return null;
    }
    
    const user = await getUserById(decoded.userId);
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    return null;
  }
}