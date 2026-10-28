import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { mockRes } from "./helpers.js";
import { authMiddleware } from "../middlewares/auth.js";

beforeEach(() => { process.env.JWT_SECRET = "secret"; });

describe("authMiddleware  V(G)=4", () => {
  it("TC_AUTH_01 (Path 1) no Authorization header -> 401", () => {
    const res = mockRes(), next = vi.fn();
    authMiddleware({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied. No token provided." });
    expect(next).not.toHaveBeenCalled();
  });
  it("TC_AUTH_02 (Path 2) header present but token part missing -> 401", () => {
    const res = mockRes(), next = vi.fn();
    authMiddleware({ headers: { authorization: "Bearer" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
  it("TC_AUTH_03 (Path 3) valid token -> userId set, next() called", () => {
    const token = jwt.sign({ id: "u1" }, "secret");
    const req = { headers: { authorization: `Bearer ${token}` } }, res = mockRes(), next = vi.fn();
    authMiddleware(req, res, next);
    expect(req.userId).toBe("u1");
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
  it("TC_AUTH_04 (Path 4) invalid token -> 400", () => {
    const res = mockRes(), next = vi.fn();
    authMiddleware({ headers: { authorization: "Bearer not.a.token" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token." });
    expect(next).not.toHaveBeenCalled();
  });
});
