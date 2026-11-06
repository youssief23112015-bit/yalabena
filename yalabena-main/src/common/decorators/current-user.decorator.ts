import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser()               → the full request.user (JwtStrategy.validate output)
 * CurrentUser('id')           → just that property, e.g. the user id string
 *
 * The previous implementation ignored `data`, so `@CurrentUser('id')`
 * silently received the whole user object — breaking every service that
 * expected a plain userId (attendance, leads, waitlists).
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
