/*
 * Creates (or resets) an administrator account. There is intentionally no public sign-up endpoint.
 *
 *   npm run create-admin                                   # interactive prompts
 *   npm run create-admin -- --email you@example.com --name "Your Name"
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run create-admin     # non-interactive (CI / containers)
 *   add --reset to change the password of an existing account
 */
import readline from 'node:readline';
import { parseArgs } from 'node:util';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import { userCreateSchema } from '../validators/content.js';

const { values: args } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', default: 'admin' },
    reset: { type: 'boolean', default: false },
  },
});

function ask(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : s.replace(/[^\r\n]/g, '*'));
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email = (args.email || process.env.ADMIN_EMAIL || (await ask('Admin email: '))).trim().toLowerCase();
  userCreateSchema.pick({ email: true }).parse({ email });

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing && !args.reset) {
    throw new Error(`A user with ${email} already exists. Re-run with --reset to change its password.`);
  }

  // Resetting keeps the existing name unless --name is given; only new accounts are asked for one.
  const name =
    args.name || process.env.ADMIN_NAME || existing?.name || (process.env.ADMIN_EMAIL ? 'Administrator' : await ask('Display name: ')) || 'Administrator';
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    password = await ask(`New password for ${email} (min 10 chars): `, { hidden: true });
    const confirm = await ask('Confirm password: ', { hidden: true });
    if (password !== confirm) throw new Error('Passwords do not match');
  }

  const data = userCreateSchema.parse({ email, name, password, role: args.role });
  const user = existing || new User({ email: data.email });
  user.name = data.name;
  user.role = data.role;
  user.status = 'active';
  await user.setPassword(data.password);
  await user.save();
  console.log(`\n✔ ${existing ? 'Updated' : 'Created'} ${user.role} account for ${user.email}. Sign in at /admin/login\n`);
}

main()
  .catch((err) => {
    const msg = err.issues ? err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') : err.message;
    console.error(`\n✖ ${msg}\n`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
