import { z } from "zod";

const id = z.number().int().positive();

export const accessCardSchema = z
  .object({
    roleId: z
      .number({ error: "Choose a role" })
      .int()
      .positive("Choose a role"),
    projectId: id.nullable(),
    entityIds: z.array(id),
    environmentIds: z.array(id),
  })
  .refine((card) => card.entityIds.length === 0 || card.projectId !== null, {
    message: "Choose a project to pick entities",
    path: ["entityIds"],
  });
