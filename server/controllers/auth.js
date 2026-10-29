import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { clearSession, issueSession } from '../middleware/auth.js';
import { unauthorized } from '../utils/errors.js';

// Always run a bcrypt compare so unknown emails are not measurably faster to reject.
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash('not-a-real-password', 12));

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user ? await user.checkPassword(password) : await bcrypt.compare(password, await getDummyHash());
  if (!user || !ok) throw unauthorized('Invalid email or password');
  if (user.status !== 'active') throw unauthorized('This account has been disabled');

  user.lastLoginAt = new Date();
  await user.save();
  const csrfToken = issueSession(res, user);
  res.json({ user: user.toJSON(), csrfToken });
}

export function logout(_req, res) {
  clearSession(res);
  res.json({ ok: true });
}

export function me(req, res) {
  res.json({ user: req.user.toJSON(), csrfToken: req.session.csrf });
}
