import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRes } from "./helpers.js";

const m = vi.hoisted(() => ({
  save: vi.fn(), findOne: vi.fn(),
  genSalt: vi.fn(), hash: vi.fn(), compare: vi.fn(), sign: vi.fn(),
}));
vi.mock("../models/userModel.js", () => {
  const User = vi.fn(function (data) { Object.assign(this, data); this._id = "u1"; this.save = m.save; });
  User.findOne = m.findOne;
  return { default: User };
});
vi.mock("bcryptjs", () => ({ default: { genSalt: m.genSalt, hash: m.hash, compare: m.compare } }));
vi.mock("jsonwebtoken", () => ({ default: { sign: m.sign } }));

import { registerUser, loginUser } from "../controllers/userController.js";

beforeEach(() => { vi.clearAllMocks(); vi.spyOn(console, "log").mockImplementation(() => {}); });

describe("registerUser  V(G)=5", () => {
  it("TC_REG_01 (Path 1) name missing", async () => {
    const res = mockRes();
    await registerUser({ body: { email: "a@x.com", password: "p" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "All fields are required" });
    expect(m.genSalt).not.toHaveBeenCalled();
  });
  it("TC_REG_02 (Path 2) email missing", async () => {
    const res = mockRes();
    await registerUser({ body: { name: "A", password: "p" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "All fields are required" });
    expect(m.genSalt).not.toHaveBeenCalled();
  });
  it("TC_REG_03 (Path 3) password missing", async () => {
    const res = mockRes();
    await registerUser({ body: { name: "A", email: "a@x.com" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "All fields are required" });
    expect(m.genSalt).not.toHaveBeenCalled();
  });
  it("TC_REG_04 (Path 4) valid details -> user saved, token returned", async () => {
    process.env.JWT_SECRET = "secret";
    m.genSalt.mockResolvedValue("salt"); m.hash.mockResolvedValue("hashed");
    m.sign.mockReturnValue("tok123"); m.save.mockResolvedValue({ name: "Asha" });
    const res = mockRes();
    await registerUser({ body: { name: "Asha", email: "asha@x.com", password: "pw123" } }, res);
    expect(m.genSalt).toHaveBeenCalledWith(10);
    expect(m.hash).toHaveBeenCalledWith("pw123", "salt");
    expect(m.sign).toHaveBeenCalledWith({ id: "u1" }, "secret");
    expect(res.json).toHaveBeenCalledWith({ success: true, token: "tok123", user: { name: "Asha" } });
  });
  it("TC_REG_05 (Path 5) database error (duplicate email) -> error message", async () => {
    m.genSalt.mockResolvedValue("salt"); m.hash.mockResolvedValue("hashed"); m.sign.mockReturnValue("t");
    m.save.mockRejectedValue(new Error("E11000 duplicate key error"));
    const res = mockRes();
    await registerUser({ body: { name: "Asha", email: "asha@x.com", password: "pw123" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "E11000 duplicate key error" });
  });
});

describe("loginUser  V(G)=6", () => {
  it("TC_LOG_01 (Path 1) email missing", async () => {
    const res = mockRes();
    await loginUser({ body: { password: "p" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "All fields are required" });
    expect(m.findOne).not.toHaveBeenCalled();
  });
  it("TC_LOG_02 (Path 2) password missing", async () => {
    const res = mockRes();
    await loginUser({ body: { email: "a@x.com" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "All fields are required" });
    expect(m.findOne).not.toHaveBeenCalled();
  });
  it("TC_LOG_03 (Path 3) user not found", async () => {
    m.findOne.mockResolvedValue(null);
    const res = mockRes();
    await loginUser({ body: { email: "no@x.com", password: "p" } }, res);
    expect(m.findOne).toHaveBeenCalledWith({ email: "no@x.com" });
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "User not found" });
    expect(m.compare).not.toHaveBeenCalled();
  });
  it("TC_LOG_04 (Path 4) wrong password", async () => {
    m.findOne.mockResolvedValue({ _id: "u1", name: "Asha", password: "hashed" });
    m.compare.mockResolvedValue(false);
    const res = mockRes();
    await loginUser({ body: { email: "asha@x.com", password: "bad" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid credentials" });
    expect(m.sign).not.toHaveBeenCalled();
  });
  it("TC_LOG_05 (Path 5) correct credentials -> token", async () => {
    process.env.JWT_SECRET = "secret";
    m.findOne.mockResolvedValue({ _id: "u1", name: "Asha", password: "hashed" });
    m.compare.mockResolvedValue(true); m.sign.mockReturnValue("tok123");
    const res = mockRes();
    await loginUser({ body: { email: "asha@x.com", password: "pw123" } }, res);
    expect(m.compare).toHaveBeenCalledWith("pw123", "hashed");
    expect(res.json).toHaveBeenCalledWith({ success: true, token: "tok123", user: { name: "Asha" } });
  });
  it("TC_LOG_06 (Path 6) database error", async () => {
    m.findOne.mockRejectedValue(new Error("DB down"));
    const res = mockRes();
    await loginUser({ body: { email: "asha@x.com", password: "pw123" } }, res);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "DB down" });
  });
});
