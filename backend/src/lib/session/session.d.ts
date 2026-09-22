import "express-session";

import type { SessionData as FlaggerSessionData } from "./types";

// Augments express-session's SessionData so req.session.userId is typed
// everywhere, instead of allowing arbitrary properties.
declare module "express-session" {
  interface SessionData extends FlaggerSessionData {}
}
