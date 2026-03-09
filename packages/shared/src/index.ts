// Single source of truth for all API wire types.
// Schema files (.schema.ts) are the authoritative definitions — TypeBox schemas
// live there and TypeScript types are derived from them via Static<T>.
// Types files (.types.ts) are type-only re-exports — safe for frontend consumption.

// ── Todos ─────────────────────────────────────────────────────────────────────
export type {
  CreateTodoRequest,
  Todo,
  UpdateTodoRequest,
} from "./todos/todos.types.ts";

// ── Users ─────────────────────────────────────────────────────────────────────
export type {
  CreateUserRequest,
  UserResponseDto,
  UserRole,
} from "./user/user.types.ts";
