import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { cleanDatabase, seedTestData, prisma } from "./setup.js";

const app = buildApp();

let employeeToken: string;
let slot1Id: string;
let slot2Id: string;

beforeEach(async () => {
  await cleanDatabase();
  const { slot1, slot2 } = await seedTestData();
  slot1Id = slot1.id;
  slot2Id = slot2.id;

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

describe("GET /api/slots/available", () => {
  it("returns all active slots when none are occupied", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/slots/available",
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().slots).toHaveLength(2);
  });

  it("does not return occupied slots", async () => {
    await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/slots/available",
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    expect(res.json().slots).toHaveLength(1);
  });
});

describe("POST /api/checkins", () => {
  it("employee can check in to available slot", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().checkedOutAt).toBeNull();
  });

  it("rejects check-in to occupied slot", async () => {
    // Register a second employee and check in to slot1
    await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "emp2@test.com",
        password: "Pass@1234",
        employeeId: "EMP999",
        vehicleId: "DL01",
        phoneNumber: "9876543299",
      },
    });
    const emp2Res = await app.inject({
      method: "POST",
      url: "/api/auth/signin",
      payload: { email: "emp2@test.com", password: "Pass@1234" },
    });
    const emp2Token = emp2Res.json().token;

    // emp2 checks in to slot1 first
    await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${emp2Token}` },
      payload: { slotId: slot1Id },
    });

    // original employee tries to check in to same slot
    const res = await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects double check-in by same employee", async () => {
    await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot2Id },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe("PATCH /api/checkins/:id/checkout", () => {
  it("employee can check out", async () => {
    const checkInRes = await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id },
    });
    const checkInId = checkInRes.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/checkins/${checkInId}/checkout`,
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().checkedOutAt).not.toBeNull();
  });

  it("slot is available again after checkout", async () => {
    const checkInRes = await app.inject({
      method: "POST",
      url: "/api/checkins",
      headers: { authorization: `Bearer ${employeeToken}` },
      payload: { slotId: slot1Id },
    });
    const checkInId = checkInRes.json().id;

    await app.inject({
      method: "PATCH",
      url: `/api/checkins/${checkInId}/checkout`,
      headers: { authorization: `Bearer ${employeeToken}` },
    });

    const avail = await app.inject({
      method: "GET",
      url: "/api/slots/available",
      headers: { authorization: `Bearer ${employeeToken}` },
    });
    expect(avail.json().slots).toHaveLength(2);
  });
});
