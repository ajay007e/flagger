# Authorization: manual check

Rules: a resource the user cannot see returns 404 `NOT_FOUND`. 403 `FORBIDDEN` is returned only when the user can see the resource but lacks the permission. Both use the standard error body: `{ success: false, message, code, requestId }`, with the same id in the `x-request-id` header.

## Setup

- Admin A, and user U with the Viewer role on project 1, limited to environment `dev`.
- Project 2 exists. Project 999 does not. Use an entity in each project and the `staging` environment.

## As U

| Request                                            | Expected                                |
| -------------------------------------------------- | --------------------------------------- |
| `GET /projects/1`                                  | 200                                     |
| `GET /projects/2`                                  | 404 `NOT_FOUND`                         |
| `GET /projects/999`                                | 404, same code and message as project 2 |
| `PATCH /projects/1`                                | 403 `FORBIDDEN`                         |
| `PATCH /projects/2`                                | 404 `NOT_FOUND`                         |
| `PATCH /projects/999`                              | 404, same code and message as project 2 |
| `POST /projects/2/restore`                         | 404                                     |
| `POST /projects`                                   | 403 (no target, nothing to hide)        |
| `GET /projects/2/entities`                         | 404                                     |
| `POST /projects/1/entities`                        | 403                                     |
| `PATCH /projects/1/entities/{entity of project 1}` | 403                                     |
| `PATCH /projects/2/entities/{entity of project 2}` | 404                                     |
| `PATCH /environments/{dev}`                        | 403                                     |
| `PATCH /environments/{staging}`                    | 404                                     |
| `PUT /environments/order`                          | 403                                     |
| `GET /users`                                       | 403                                     |
| `PATCH /users/1` and `PATCH /users/999`            | 404, same code and message              |
| `GET /users/1/access`                              | 404                                     |

## As a user with no assignment

- `PATCH /projects/1` returns 404, because nothing is visible.

## As admin A

- Every request above succeeds or returns the service's own 404 (`Project not found`), never 403.

## `requires(...)` probe

Add a throwaway route `requires("flag:update", (req) => ({ projectId: Number(req.params.projectId) }))`.

| User                | Project | Expected |
| ------------------- | ------- | -------- |
| Viewer on project 1 | 1       | 403      |
| Viewer on project 1 | 2       | 404      |
| Editor on project 1 | 1       | 200      |

## Logs

- 404 from a hidden resource logs `authorization.hidden`. 403 logs `auth.denied` (admin-only routes) or `authorization.denied` (permission routes).
