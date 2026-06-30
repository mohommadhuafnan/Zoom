import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, throwIfError } from '../config/supabase.js';
import { signToken } from '../middleware/auth.js';
import { mapUser, userToDb } from '../utils/dbMappers.js';

const SALT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function registerUser({ email, password, displayName }) {
  const { data: existing, error: findError } = await getSupabase()
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  throwIfError(findError, 'Failed to check email');

  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date().toISOString();

  const { data: row, error } = await getSupabase()
    .from('users')
    .insert({
      id: uuidv4(),
      ...userToDb({ email, passwordHash, displayName }),
      updated_at: now,
    })
    .select()
    .single();

  throwIfError(error, 'Failed to create user');

  const user = mapUser(row);
  const token = signToken({ userId: user.id, email: user.email });
  return { user: sanitizeUser(user), token };
}

export async function loginUser({ email, password }) {
  const { data: row, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  throwIfError(error, 'Failed to look up user');

  const user = mapUser(row);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = signToken({ userId: user.id, email: user.email });
  return { user: sanitizeUser(user), token };
}

export async function getUserById(userId) {
  const { data: row, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  throwIfError(error, 'Failed to fetch user');
  return sanitizeUser(mapUser(row));
}

export async function updateUserProfile(userId, { displayName, avatarUrl }) {
  const { data: row, error } = await getSupabase()
    .from('users')
    .update({
      ...userToDb({ displayName, avatarUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  throwIfError(error, 'Failed to update profile');
  return sanitizeUser(mapUser(row));
}
