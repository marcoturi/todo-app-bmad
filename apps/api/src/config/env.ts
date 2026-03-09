import envSchema from 'env-schema';
import { type Static, Type } from 'typebox';

const NodeEnv = {
  development: 'development',
  production: 'production',
  test: 'test',
} as const;

export const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const schema = Type.Object({
  DATABASE_URL: Type.String(),
  FRONTEND_URL: Type.String({ default: 'http://localhost:5173' }),
  LOG_LEVEL: Type.Enum(LogLevel),
  NODE_ENV: Type.Enum(NodeEnv),
  HOST: Type.String({ default: 'localhost' }),
  PORT: Type.Number({ default: 3000 }),
});

const env = envSchema<Static<typeof schema>>({
  dotenv: true,
  schema,
});

export default {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === NodeEnv.development,
  isProduction: env.NODE_ENV === NodeEnv.production,
  version: process.env.npm_package_version ?? '0.0.0',
  log: {
    level: env.LOG_LEVEL,
  },
  server: {
    host: env.HOST,
    port: env.PORT,
    frontendUrl: env.FRONTEND_URL,
  },
  db: {
    url: env.DATABASE_URL,
  },
};
