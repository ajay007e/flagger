import { disconnectDatabase, prisma } from "./client";
import { DEFAULT_SYSTEM_SETTINGS } from "../constants";

// Safe to run repeatedly: existing rows are never overwritten (update is empty),
// so values changed later through the app are kept.
async function main(): Promise<void> {
  for (const setting of DEFAULT_SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`Seeded ${DEFAULT_SYSTEM_SETTINGS.length} system setting(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
