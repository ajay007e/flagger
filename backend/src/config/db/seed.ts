import { disconnectDatabase, prisma } from "./client";
import {
  DEFAULT_ENVIRONMENTS,
  DEFAULT_ROLES,
  DEFAULT_SYSTEM_SETTINGS,
} from "./seed.constants";
import { assertPermissions } from "../../lib/permissions";

async function main(): Promise<void> {
  for (const setting of DEFAULT_SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`Seeded ${DEFAULT_SYSTEM_SETTINGS.length} system setting(s).`);

  for (const environment of DEFAULT_ENVIRONMENTS) {
    await prisma.environment.upsert({
      where: { key: environment.key },
      update: {},
      create: environment,
    });
  }

  console.log(`Seeded ${DEFAULT_ENVIRONMENTS.length} environment(s).`);

  for (const { permissions, ...data } of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { key: data.key },
      update: {},
      create: data,
    });

    await prisma.rolePermission.createMany({
      data: assertPermissions(permissions).map((permission) => ({
        roleId: role.id,
        permission,
      })),
      skipDuplicates: true,
    });
  }

  console.log(`Seeded ${DEFAULT_ROLES.length} role(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
