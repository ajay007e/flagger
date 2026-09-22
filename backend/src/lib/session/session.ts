import { RedisStore } from "connect-redis";
import session, { type SessionOptions } from "express-session";

import { env, redis } from "@/config";

import {
  SESSION_COOKIE_NAME,
  SESSION_KEY_PREFIX,
  SESSION_TTL_SECONDS,
} from "./constants";

const store = new RedisStore({
  client: redis,
  prefix: SESSION_KEY_PREFIX,
  ttl: SESSION_TTL_SECONDS,
});

const sessionOptions: SessionOptions = {
  name: SESSION_COOKIE_NAME,
  store,
  secret: env.sessionSecret,
  // The store only ever holds { userId, sessionVersion } (see ./types), so there is
  // nothing to persist until login sets them.
  resave: false,
  saveUninitialized: false,
  rolling: true, // refresh the cookie's expiry, and the Redis TTL, on every request
  cookie: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
  },
};

export const sessionMiddleware = session(sessionOptions);
