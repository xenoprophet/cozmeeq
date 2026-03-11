import { ActivityLogType } from '@pulse/shared';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db';
import { users } from '../../db/schema';
import { enqueueActivityLog } from '../../queues/activity-log';
import { hashPassword, verifyPassword } from '../../utils/better-auth';
import { invariant } from '../../utils/invariant';
import { protectedProcedure } from '../../utils/trpc';

const updatePasswordRoute = protectedProcedure
  .input(
    z.object({
      currentPassword: z.string().min(4).max(128),
      newPassword: z.string().min(4).max(128),
      confirmNewPassword: z.string().min(4).max(128)
    })
  )
  .mutation(async ({ ctx, input }) => {
    const [user] = await db
      .select({
        passwordHash: users.passwordHash
      })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    invariant(user, {
      code: 'NOT_FOUND',
      message: 'User not found'
    });

    const isCurrentPasswordValid = await verifyPassword(
      input.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      ctx.throwValidationError(
        'currentPassword',
        'Current password is incorrect'
      );
    }

    if (input.newPassword !== input.confirmNewPassword) {
      ctx.throwValidationError(
        'confirmNewPassword',
        'New password and confirmation do not match'
      );
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(input.newPassword) })
      .where(eq(users.id, ctx.userId));

    enqueueActivityLog({
      type: ActivityLogType.USER_UPDATED_PASSWORD,
      userId: ctx.user.id
    });
  });

export { updatePasswordRoute };
