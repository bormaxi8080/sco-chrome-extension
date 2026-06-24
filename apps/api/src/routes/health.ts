import type { FastifyInstance } from "fastify";

export const registerHealthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/health", async () => ({
    status: "ok",
    service: "source-credibility-overlay-api",
    checkedAt: new Date().toISOString()
  }));
};
