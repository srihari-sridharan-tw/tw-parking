import type { FastifyInstance } from "fastify";
import { requireRole } from "../../hooks/authenticate.js";
import { listUsers, clearEmployees } from "./users.service.js";

export async function usersRoutes(app: FastifyInstance) {
  const adminOnly = { preHandler: requireRole("ADMIN") };

  app.get("/", adminOnly, async (_request, reply) => {
    const users = await listUsers();
    return reply.send({ users });
  });

  app.delete<{ Body: { password: string } }>(
    "/employees",
    adminOnly,
    async (request, reply) => {
      const result = await clearEmployees(
        request.user.userId,
        request.body.password
      );
      return reply.send(result);
    }
  );
}
