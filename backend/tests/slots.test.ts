import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { cleanDatabase, seedTestData, prisma } from "./setup.js";

const app = buildApp();

let adminToken: string;
let employeeToken: string;

beforeEach(async () => {
  await cleanDatabase();
  const { admin, employee } = await seedTestData();

  const adminRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "admin@test.com", password: "Admin@1234" },
  });
  adminToken = adminRes.json().token;

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

describe("GET /api/slots", () => {
  it("admin can list slots", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.slots).toHaveLength(2);
  });

  it("employee is forbidden", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/slots",
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it("unauthenticated request is rejected", async () => {
    const res = await app.inject({ method: "GET", url: "/api/slots" });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/slots", () => {
  it("admin can create a slot", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { slotCode: "M3001", level: 3, type: "TWO_WHEELER" },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().slotCode).toBe("M3001");
  });

  it("rejects duplicate slotCode", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { slotCode: "M1001", level: 1, type: "TWO_WHEELER" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects invalid slot code format", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { slotCode: "A1-01", level: 1, type: "TWO_WHEELER" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("employee cannot create slot", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/slots",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotCode: "M9001", level: 1, type: "TWO_WHEELER" },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("PUT /api/slots/:id", () => {
  it("admin can update a slot", async () => {
    const slots = await app.inject({
      method: "GET",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const slotId = slots.json().slots[0].id;

    const res = await app.inject({
      method: "PUT",
      url: `/api/slots/${slotId}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { level: 5 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().level).toBe(5);
  });
});

describe("DELETE /api/slots/:id", () => {
  it("admin can soft-delete a slot", async () => {
    const slots = await app.inject({
      method: "GET",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const slotId = slots.json().slots[0].id;

    const delRes = await app.inject({
      method: "DELETE",
      url: `/api/slots/${slotId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(delRes.statusCode).toBe(204);

    const listRes = await app.inject({
      method: "GET",
      url: "/api/slots",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.json().slots).toHaveLength(1);
  });
});
