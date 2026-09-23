# API errors

Every error response has the same shape, so the frontend can rely on it:

```json
{ "success": false, "message": "Route not found", "code": "NOT_FOUND" }
```

`message` is safe to show to a user. `code` is for the frontend to act on.

## Codes

| Code                       | Status | When                                                       |
| -------------------------- | ------ | ---------------------------------------------------------- |
| `UNAUTHENTICATED`          | 401    | No valid session                                           |
| `SESSION_EXPIRED`          | 401    | The session is no longer valid                             |
| `PASSWORD_CHANGE_REQUIRED` | 403    | The user must change a temporary password first            |
| `NOT_FOUND`                | 404    | Unknown route, or something the user is not allowed to see |
| `VALIDATION_ERROR`         | 400    | Invalid request body                                       |
| `CONFLICT`                 | 409    | The resource already exists (e.g. an email already in use) |
| `INTERNAL_ERROR`           | 500    | Anything unexpected. Details are only in the server log.   |

Things a user is not allowed to see return `NOT_FOUND` (not "forbidden"), so the API does not reveal that they exist.

Unexpected errors always return a generic message. The real error and stack trace are logged on the server only.

## In the backend

```ts
import { AppError, ERROR_CODES } from "@/lib/errors";

throw new AppError(ERROR_CODES.NOT_FOUND, "Project not found");
throw new AppError(ERROR_CODES.UNAUTHENTICATED); // uses the default message and status
```

- **Async routes:** Express 4 does not catch errors thrown in async handlers. Wrap them:

  ```ts
  import { asyncHandler } from "@/middleware";

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      /* ... */
    }),
  );
  ```

- **Request bodies:** validate with a zod schema. On failure the request ends with `VALIDATION_ERROR` and a readable message such as `email: is required or has the wrong type`.

  ```ts
  import { validateBody } from "@/middleware";

  router.post("/login", validateBody(loginSchema), handler);
  ```

- **Unknown routes** and **invalid JSON** are handled automatically.
- `notFound` and `errorHandler` are registered last in `app.ts`.

## In the frontend

```ts
import { ERROR_CODES, getErrorCode, getErrorMessage } from "@/shared";

try {
  await api.post("/api/auth/login", body);
} catch (error) {
  const message = getErrorMessage(error); // the backend's message, or a fallback
  if (getErrorCode(error) === ERROR_CODES.PASSWORD_CHANGE_REQUIRED) {
    // redirect to the change-password page
  }
}
```

If the server cannot be reached at all, `getErrorMessage` returns "Unable to reach the server".

## Adding a code

1. Add it to `backend/src/lib/errors/constants.ts` (code, default status, default message).
2. Add it to `frontend/shared/constants.ts`.
3. Add a row to the table above.

The two lists have to be kept in sync by hand.
