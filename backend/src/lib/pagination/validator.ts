import { z } from "zod";

import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_MAX_LIMIT,
} from "./constants";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_MAX_LIMIT)
    .default(PAGINATION_DEFAULT_LIMIT),
});
