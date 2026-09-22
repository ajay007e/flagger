import { app } from "@/app";
import { env } from "@/config";
import { connectDatabase, connectRedis } from "@/config";

async function start(): Promise<void> {
  try {
    await connectDatabase();
    console.log("Connected to MySQL");

    await connectRedis();
    console.log("Connected to Redis");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start application");
    console.error(error instanceof Error ? error.message : error);

    process.exit(1);
  }
}

void start();
