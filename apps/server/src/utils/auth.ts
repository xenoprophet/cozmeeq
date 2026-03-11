import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();
const issuer = 'pulse-auth';
const audience = 'pulse';

const getJwtSecret = () => {
  const secret = process.env.AUTH_JWT_SECRET || process.env.SERVER_SECRET || process.env.SECRET;

  if (!secret) {
    throw new Error('Missing AUTH_JWT_SECRET environment variable');
  }

  return encoder.encode(secret);
};

const hashPassword = async (password: string): Promise<string> =>
  Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10
  });

const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> =>
  Bun.password.verify(password, passwordHash);

const createAccessToken = async (userId: string): Promise<string> => {
  return new SignJWT({ type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getJwtSecret());
};

const createRefreshToken = async (userId: string): Promise<string> => {
  return new SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
};

const verifyAccessToken = async (token: string): Promise<string | undefined> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer,
      audience
    });

    if (payload.type !== 'access') return undefined;

    return payload.sub;
  } catch {
    return undefined;
  }
};

export {
  createAccessToken,
  createRefreshToken,
  hashPassword,
  verifyAccessToken,
  verifyPassword
};
