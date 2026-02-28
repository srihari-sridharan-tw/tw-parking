import type { FastifyInstance } from "fastify";
import { requireRole } from "../../hooks/authenticate.js";
import { getDailyReport } from "./reports.service.js";

export async function reportsRoutes(app: FastifyInstance) {
  app.get(
    "/daily",
    { preHandler: requireRole("ADMIN", "SECURITY") },
    async (_request, reply) => {
      const report = await getDailyReport();
      return reply.send(report);
    }
  );
}
