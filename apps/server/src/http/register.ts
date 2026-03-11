import { and, eq, sql } from 'drizzle-orm';
import http from 'http';
import z from 'zod';
import { db } from '../db';
import { isInviteValid } from '../db/queries/invites';
import { getSettings } from '../db/queries/server';
import { getUserByEmail, isDisplayNameTaken } from '../db/queries/users';
import { invites } from '../db/schema';
import { getWsInfo } from '../helpers/get-ws-info';
import { createAccessToken, createRefreshToken, hashPassword } from '../utils/better-auth';
import { isRegistrationDisabled } from '../utils/env';
import { getJsonBody } from './helpers';
import { registerUser } from './register-user';
import { HttpValidationError } from './utils';

const zBody = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters').max(128),
  displayName: z.string().min(1, 'Display name is required').max(64),
  invite: z.string().optional()
});

const registerRouteHandler = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const data = zBody.parse(await getJsonBody(req));
  const settings = await getSettings();
  const connectionInfo = getWsInfo(undefined, req);

  if (await isDisplayNameTaken(data.displayName)) {
    throw new HttpValidationError('displayName', 'This display name is already taken');
  }

  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    throw new HttpValidationError('email', 'An account with this email already exists');
  }

  if (isRegistrationDisabled() || !settings.allowNewUsers) {
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

  await registerUser(
    authUserId,
    data.email,
    passwordHash,
    data.invite,
    connectionInfo?.ip,
    data.displayName
  );

  const accessToken = await createAccessToken(authUserId);
  const refreshToken = await createRefreshToken(authUserId);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, accessToken, refreshToken }));

  return res;
};

export { registerRouteHandler };
