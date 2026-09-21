import { app } from "@/app";
import { env } from "@/config";

function start(): void {
  try {
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start application");
    console.error(error);

    process.exit(1);
  }
}

start();
