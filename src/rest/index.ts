import path from "path";
import express from "express";
import * as OpenApiValidator from "express-openapi-validator";

import { v1 } from "./v1";
import { prisma } from "../prismaClient";


const app = express();
const PORT = process.env.PORT || 80;

app.use(express.json());
app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, "v1", "openapi.yml"),
    validateRequests: true,
    validateResponses: true,
  }),
);
app.use("/v1", v1);


export function start() {
  const server = app.listen(PORT, () => {
    console.log(`HTTP server running at: http://localhost:${PORT}`);
  });

  // Gracefully disconnect from the DB and shutdown server.
  process.on("SIGINT", async () => {
    try {
      await prisma.$disconnect();
    } catch (err) {
      console.error("Error during disconnect:", err);
    }

    server.close(() => {
      console.log("Process terminated");
      // Exit the process after everything is done
      process.exit(0);
    });
  });
}
