import request from "supertest";
import app from "../../app.ts";

describe("health endpoints", () => {
  it("returns 200 OK for /healthcheck", async () => {
    const res = await request(app).get("/healthcheck");
    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
  });
});

