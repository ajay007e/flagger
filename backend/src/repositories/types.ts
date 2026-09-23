import type { Prisma, PrismaClient } from "@/generated/prisma/client";

/**
 * A Prisma client or an active `$transaction` callback client. Every
 * repository function takes one of these as its first argument, so a caller
 * can run several repository calls (and an audit write) in one transaction:
 *
 *   await prisma.$transaction(async (tx) => {
 *     const user = await userRepository.create(tx, data);
 *     await writeAuditLog(tx, { ... });
 *   });
 *
 * Outside a transaction, pass `prisma` itself.
 */
export type DbClient = PrismaClient | Prisma.TransactionClient;
