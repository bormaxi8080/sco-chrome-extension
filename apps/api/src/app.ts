import cors from "@fastify/cors";
import Fastify from "fastify";
import type { ApiConfig } from "./config.js";
import { RiskCardRepository } from "./db/postgres.js";
import { registerDomainRoutes } from "./routes/domains.js";
import { registerHealthRoutes } from "./routes/health.js";
import { DomainAnalyzer } from "./services/analyzer.js";

const originAllowed = (origin: string | undefined, allowed: string[]): boolean => {
  if (!origin) return true;
  if (allowed.includes("*") || allowed.includes(origin)) return true;
  return allowed.some((item) => item.endsWith("*") && origin.startsWith(item.slice(0, -1)));
};

export const buildApp = async (config: ApiConfig) => {
  const app = Fastify({ logger: true });
  const repository = new RiskCardRepository(config.databaseUrl);
  await repository.init();
  const analyzer = new DomainAnalyzer(config, repository);

  await app.register(cors, {
    origin: (origin, callback) => {
      callback(null, originAllowed(origin, config.corsExtensionOrigins));
    }
  });
  await registerHealthRoutes(app);
  await registerDomainRoutes(app, analyzer);

  app.addHook("onClose", async () => {
    await repository.close();
  });

  return app;
};
