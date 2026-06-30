import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { signToken } from '../middleware/auth.js';

const SALT_ROUNDS = 12;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function registerUser({ email, password, displayName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { user: sanitizeUser(user), token };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return sanitizeUser(user);
}

export async function updateUserProfile(userId, { displayName, avatarUrl }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });
  return sanitizeUser(user);
}
