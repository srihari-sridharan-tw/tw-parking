import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { cleanDatabase, seedTestData, prisma } from "./setup.js";

const app = buildApp();

let adminToken: string;
let securityToken: string;
let employeeToken: string;

beforeEach(async () => {
  await cleanDatabase();
  await seedTestData();

  const adminRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "admin@test.com", password: "Admin@1234" },
  });
  adminToken = adminRes.json().token;

  const secRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "security@test.com", password: "Security@1234" },
  });
  securityToken = secRes.json().token;

  const empRes = await app.inject({
    method: "POST",
    url: "/api/auth/signin",
    payload: { email: "employee@test.com", password: "Employee@1234" },
  });
  employeeToken = empRes.json().token;
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

describe("GET /api/reports/daily", () => {
  it("admin can view daily report", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/reports/daily",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("totalSlots");
    expect(body).toHaveProperty("usedSlots");
    expect(body).toHaveProperty("emptySlots");
    expect(body).toHaveProperty("occupiedSlots");
    expect(body.totalSlots).toBe(2);
  });

  it("security can view daily report", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/reports/daily",
      headers: { authorization: `Bearer ${securityToken}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it("employee is forbidden from daily report", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/reports/daily",
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("report counts are correct after a check-in", async () => {
    const slots = await prisma.parkingSlot.findMany();
    await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slots[0]!.id },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/reports/daily",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const body = res.json();
    expect(body.usedSlots).toBe(1);
    expect(body.emptySlots).toBe(1);
    expect(body.occupiedSlots).toHaveLength(1);
  });
});
