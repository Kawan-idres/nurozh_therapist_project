import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (e) => {
    logger.debug("Database Query", {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

prisma.$on("error", (e) => {
  logger.error("Database Error", { error: e });
});

prisma.$on("warn", (e) => {
  logger.warn("Database Warning", { warning: e });
});

export default prisma;
