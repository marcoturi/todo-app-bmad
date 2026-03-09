import { type Static, Type } from 'typebox';

export const userRoleSchema = Type.Union(
  [Type.Literal('admin'), Type.Literal('moderator'), Type.Literal('guest')],
  { description: "User's role", example: 'guest' },
);

export const userResponseDtoSchema = Type.Object({
  id: Type.String({
    format: 'uuid',
    example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
    description: "Entity's id",
  }),
  createdAt: Type.String({
    example: '2020-11-24T17:43:15.970Z',
    description: 'Entity creation date',
  }),
  updatedAt: Type.String({
    example: '2020-11-24T17:43:15.970Z',
    description: 'Entity last update date',
  }),
  email: Type.String({
    format: 'email',
    example: 'test@mail.com',
    description: "User's email address",
  }),
  country: Type.String({
    example: 'France',
    description: "User's country of residence",
  }),
  postalCode: Type.String({
    example: '123456',
    description: 'Postal code',
  }),
  street: Type.String({
    example: 'Park Avenue',
    description: 'Street where the user is registered',
  }),
  role: userRoleSchema,
});

export const createUserRequestSchema = Type.Object({
  email: Type.String({
    format: 'email',
    example: 'john@gmail.com',
    description: 'User email address',
  }),
  country: Type.String({
    example: 'France',
    description: 'Country of residence',
  }),
  postalCode: Type.String({
    example: '10000',
    description: 'Postal code',
  }),
  street: Type.String({
    example: 'Grande Rue',
    description: 'Street',
  }),
});

export type UserRole = Static<typeof userRoleSchema>;
export type UserResponseDto = Static<typeof userResponseDtoSchema>;
export type CreateUserRequest = Static<typeof createUserRequestSchema>;
