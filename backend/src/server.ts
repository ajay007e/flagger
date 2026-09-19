import "dotenv/config";

import { app } from "@/app";

const port = Number(process.env.PORT) || 4000;

function start(): void {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start application");
    console.error(error);

    process.exit(1);
  }
}

start();
