import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { DomainAnalyzer } from "../services/analyzer.js";

const domainParams = z.object({
  domain: z.string().min(1).max(253)
});

export const registerDomainRoutes = async (
  app: FastifyInstance,
  analyzer: DomainAnalyzer
): Promise<void> => {
  app.get("/v1/domains/:domain/risk-card", async (request, reply) => {
    const params = domainParams.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: "Invalid domain parameter" });
    }

    try {
      return await analyzer.analyze(params.data.domain);
    } catch (error) {
      request.log.warn({ error }, "risk card analysis failed");
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Analysis failed"
      });
    }
  });

  app.post("/v1/domains/:domain/refresh", async (request, reply) => {
    const params = domainParams.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: "Invalid domain parameter" });
    }

    try {
      return await analyzer.analyze(params.data.domain, true);
    } catch (error) {
      request.log.warn({ error }, "risk card refresh failed");
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Refresh failed"
      });
    }
  });
};
