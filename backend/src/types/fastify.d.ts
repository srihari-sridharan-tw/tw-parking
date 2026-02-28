import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      role: "ADMIN" | "EMPLOYEE" | "SECURITY";
    };
    user: {
      userId: string;
      role: "ADMIN" | "EMPLOYEE" | "SECURITY";
    };
  }
}
