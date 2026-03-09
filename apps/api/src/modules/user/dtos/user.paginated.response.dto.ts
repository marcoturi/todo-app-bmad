import { userResponseDtoSchema } from '@todo-app/shared/user/schema';
import { Type } from 'typebox';
import { paginatedResponseBaseSchema } from '#src/shared/api/paginated.response.base.ts';

export const userPaginatedResponseSchema = Type.Intersect([
  paginatedResponseBaseSchema,
  Type.Object({
    data: Type.Array(Type.Optional(userResponseDtoSchema)),
  }),
]);
