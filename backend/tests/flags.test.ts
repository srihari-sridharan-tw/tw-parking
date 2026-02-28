import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { cleanDatabase, seedTestData, prisma } from "./setup.js";

const app = buildApp();

let adminToken: string;
let securityToken: string;
let employeeToken: string;
let slot1Id: string;

beforeEach(async () => {
  await cleanDatabase();
  const { slot1 } = await seedTestData();
  slot1Id = slot1.id;

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

describe("POST /api/flags", () => {
  it("security can flag an empty slot", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/flags",
      headers: { authorization: `Bearer ${securityToken}` },
      payload: { slotId: slot1Id, vehicleId: "MH01XY9999" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.vehicleId).toBe("MH01XY9999");
    expect(body.resolvedAt).toBeNull();
  });

  it("cannot flag a slot with active registered check-in", async () => {
    await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/flags",
      headers: { authorization: `Bearer ${securityToken}` },
      payload: { slotId: slot1Id, vehicleId: "MH01XY9999" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("employee cannot create a flag", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/flags",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id, vehicleId: "MH01XY9999" },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/flags", () => {
  it("admin can list all flags", async () => {
    await app.inject({
      method: "POST",
      url: "/api/flags",
      headers: { authorization: `Bearer ${securityToken}` },
      payload: { slotId: slot1Id, vehicleId: "MH01XY9999" },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/flags",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().flags).toHaveLength(1);
  });

  it("security cannot list flags", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/flags",
      headers: { authorization: `Bearer ${securityToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("PATCH /api/flags/:id/resolve", () => {
  it("admin can resolve a flag", async () => {
    const flagRes = await app.inject({
      method: "POST",
      url: "/api/flags",
      headers: { authorization: `Bearer ${securityToken}` },
      payload: { slotId: slot1Id, vehicleId: "MH01XY9999" },
    });
    const flagId = flagRes.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/flags/${flagId}/resolve`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().resolvedAt).not.toBeNull();
  });

  it("security cannot resolve a flag", async () => {
    const flagRes = await app.inject({
      method: "POST",
      url: "/api/flags",
      headers: { authorization: `Bearer ${securityToken}` },
      payload: { slotId: slot1Id, vehicleId: "MH01XY9999" },
    });
    const flagId = flagRes.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/flags/${flagId}/resolve`,
      headers: { authorization: `Bearer ${securityToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("cannot resolve an already-resolved flag", async () => {
    const flagRes = await app.inject({
      method: "POST",
      url: "/api/flags",
      headers: { authorization: `Bearer ${securityToken}` },
      payload: { slotId: slot1Id, vehicleId: "MH01XY9999" },
    });
    const flagId = flagRes.json().id;

    await app.inject({
      method: "PATCH",
      url: `/api/flags/${flagId}/resolve`,
      headers: { authorization: `Bearer ${adminToken}` },
    });

    const res = await app.inject({
      method: "PATCH",
      url: `/api/flags/${flagId}/resolve`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(400);
  });
});
