import { z } from "zod";

const id = z.number().int().positive();

const idList = z
  .array(id)
  .refine((values) => new Set(values).size === values.length, {
    message: "must not contain duplicates",
  });

const uniqueIds = idList.optional().transform((values) => values ?? []);

export const assignAccessSchema = z
  .object({
    roleId: id,
    projectId: id
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    entityIds: uniqueIds,
    environmentIds: uniqueIds,
  })
  .refine((data) => data.entityIds.length === 0 || data.projectId !== null, {
    message: "requires a projectId",
    path: ["entityIds"],
  });

export const userAccessParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const updateAccessSchema = z
  .strictObject({
    roleId: id.optional(),
    entityIds: idList.optional(),
    environmentIds: idList.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "at least one field is required",
  });

export const assignmentParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
  assignmentId: z.uuid(),
});
