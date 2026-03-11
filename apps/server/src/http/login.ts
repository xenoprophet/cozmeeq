import { and, eq, sql } from 'drizzle-orm';
import http from 'http';
import z from 'zod';
import { db } from '../db';
import { isInviteValid } from '../db/queries/invites';
import { getSettings } from '../db/queries/server';
import { getUserByEmail } from '../db/queries/users';
import { invites } from '../db/schema';
import { getWsInfo } from '../helpers/get-ws-info';
import { createAccessToken, createRefreshToken, hashPassword, verifyPassword } from '../utils/better-auth';
import { isRegistrationDisabled } from '../utils/env';
import { getJsonBody } from './helpers';
import { registerUser } from './register-user';
import { HttpValidationError } from './utils';

const zBody = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(4, 'Password is required').max(128),
  invite: z.string().optional()
});

const loginRouteHandler = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const data = zBody.parse(await getJsonBody(req));
  const connectionInfo = getWsInfo(undefined, req);
  const normalizedEmail = data.email.includes('@') ? data.email : `${data.email}@pulse.local`;

  let existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    const isValidPassword = await verifyPassword(data.password, existingUser.passwordHash);
    if (!isValidPassword) {
      throw new HttpValidationError('email', 'Invalid email or password');
    }
  } else {
    if (isRegistrationDisabled()) {
      throw new HttpValidationError('email', 'Registration is currently disabled');
    }

    const serverSettings = await getSettings();
    if (!serverSettings.allowNewUsers) {
      if (!data.invite) {
        throw new HttpValidationError('email', 'Invalid invite code');
      }

      const result = await db
        .update(invites)
        .set({ uses: sql`${invites.uses} + 1` })
        .where(
          and(
            eq(invites.code, data.invite),
            sql`(${invites.expiresAt} IS NULL OR ${invites.expiresAt} = 0 OR ${invites.expiresAt} > ${Date.now()})`,
            sql`(${invites.maxUses} IS NULL OR ${invites.maxUses} = 0 OR ${invites.uses} < ${invites.maxUses})`
          )
        )
        .returning({ code: invites.code });

      if (result.length === 0) {
        const inviteError = await isInviteValid(data.invite);
        throw new HttpValidationError('email', inviteError || 'Invalid invite code');
      }
    }

    const authUserId = crypto.randomUUID();
    const passwordHash = await hashPassword(data.password);
    const fallbackName = normalizedEmail.split('@')[0] || 'User';

    existingUser = await registerUser(
      authUserId,
      normalizedEmail,
      passwordHash,
      data.invite,
      connectionInfo?.ip,
      fallbackName
    );
  }

  if (existingUser.banned) {
    throw new HttpValidationError(
      'email',
      `Account banned: ${existingUser.banReason || 'No reason provided'}`
    );
  }

  const accessToken = await createAccessToken(existingUser.supabaseId);
  const refreshToken = await createRefreshToken(existingUser.supabaseId);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, accessToken, refreshToken }));

  return res;
};

export { loginRouteHandler };
