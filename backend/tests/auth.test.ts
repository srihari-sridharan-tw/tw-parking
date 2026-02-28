import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { cleanDatabase, prisma } from "./setup.js";

const app = buildApp();

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe("POST /api/auth/login", () => {
  it("logs in admin with correct credentials", async () => {
    // Seed admin via register approach using prisma directly
    const bcrypt = await import("bcrypt");
    await prisma.user.create({
      data: {
        email: "admin@test.com",
        passwordHash: await bcrypt.hash("Admin@1234", 12),
        role: "ADMIN",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "admin@test.com", password: "Admin@1234" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("token");
    expect(body.role).toBe("ADMIN");
  });

  it("rejects invalid password", async () => {
    const bcrypt = await import("bcrypt");
    await prisma.user.create({
      data: {
        email: "admin@test.com",
        passwordHash: await bcrypt.hash("Admin@1234", 12),
        role: "ADMIN",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "admin@test.com", password: "wrongpassword" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("rejects employee on /login endpoint", async () => {
    const bcrypt = await import("bcrypt");
    const emp = await prisma.user.create({
      data: {
        email: "emp@test.com",
        passwordHash: await bcrypt.hash("Pass@1234", 12),
        role: "EMPLOYEE",
      },
    });
    await prisma.employeeProfile.create({
      data: {
        userId: emp.id,
        employeeId: "E001",
        vehicleId: "KA01",
        phoneNumber: "1234567890",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "emp@test.com", password: "Pass@1234" },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("POST /api/auth/register", () => {
  it("registers a new employee", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "newemployee@test.com",
        password: "Pass@1234",
        employeeId: "EMP100",
        vehicleId: "MH01XY5678",
        phoneNumber: "9876543210",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body).toHaveProperty("token");
    expect(body.role).toBe("EMPLOYEE");
  });

  it("rejects duplicate email", async () => {
    const payload = {
      email: "dupe@test.com",
      password: "Pass@1234",
      employeeId: "EMP101",
      vehicleId: "MH01",
      phoneNumber: "9876543210",
    };
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload,
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { ...payload, employeeId: "EMP102" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects duplicate employeeId", async () => {
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "first@test.com",
        password: "Pass@1234",
        employeeId: "EMP200",
        vehicleId: "MH01",
        phoneNumber: "9876543210",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "second@test.com",
        password: "Pass@1234",
        employeeId: "EMP200",
        vehicleId: "MH02",
        phoneNumber: "9876543211",
      },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe("POST /api/auth/signin", () => {
  it("employee can sign in", async () => {
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "signin@test.com",
        password: "Pass@1234",
        employeeId: "EMP300",
        vehicleId: "KA01",
        phoneNumber: "9876543210",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/signin",
      payload: { email: "signin@test.com", password: "Pass@1234" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("token");
  });

  it("admin cannot use /signin", async () => {
    const bcrypt = await import("bcrypt");
    await prisma.user.create({
      data: {
        email: "admin2@test.com",
        passwordHash: await bcrypt.hash("Admin@1234", 12),
        role: "ADMIN",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/signin",
      payload: { email: "admin2@test.com", password: "Admin@1234" },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("Password Reset", () => {
  it("forgot-password returns token in development", async () => {
    const bcrypt = await import("bcrypt");
    await prisma.user.create({
      data: {
        email: "reset@test.com",
        passwordHash: await bcrypt.hash("Old@1234", 12),
        role: "ADMIN",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/forgot-password",
      payload: { email: "reset@test.com" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("resetToken");
  });

  it("returns success even for unknown email (no enumeration)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/forgot-password",
      payload: { email: "nobody@test.com" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).not.toHaveProperty("resetToken");
  });

  it("reset-password updates the password", async () => {
    const bcrypt = await import("bcrypt");
    const user = await prisma.user.create({
      data: {
        email: "reset2@test.com",
        passwordHash: await bcrypt.hash("Old@1234", 12),
        role: "ADMIN",
      },
    });

    const forgotRes = await app.inject({
      method: "POST",
      url: "/api/auth/forgot-password",
      payload: { email: "reset2@test.com" },
    });
    const { resetToken } = forgotRes.json();

    const resetRes = await app.inject({
      method: "POST",
      url: "/api/auth/reset-password",
      payload: { token: resetToken, newPassword: "New@5678" },
    });
    expect(resetRes.statusCode).toBe(200);

    // Verify new password works
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "reset2@test.com", password: "New@5678" },
    });
    expect(loginRes.statusCode).toBe(200);
  });

  it("rejects already-used reset token", async () => {
    const bcrypt = await import("bcrypt");
    await prisma.user.create({
      data: {
        email: "reset3@test.com",
        passwordHash: await bcrypt.hash("Old@1234", 12),
        role: "ADMIN",
      },
    });

    const forgotRes = await app.inject({
      method: "POST",
      url: "/api/auth/forgot-password",
      payload: { email: "reset3@test.com" },
    });
    const { resetToken } = forgotRes.json();

    await app.inject({
      method: "POST",
      url: "/api/auth/reset-password",
      payload: { token: resetToken, newPassword: "New@5678" },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/reset-password",
      payload: { token: resetToken, newPassword: "Another@999" },
    });
    expect(res.statusCode).toBe(400);
  });
});
