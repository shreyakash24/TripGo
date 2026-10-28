import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockRes } from "./helpers.js";

const m = vi.hoisted(() => ({ save: vi.fn(), find: vi.fn(), sort: vi.fn() }));
vi.mock("../models/bookingModel.js", () => {
  const Booking = vi.fn(function (data) { Object.assign(this, data); this.save = m.save; });
  Booking.find = m.find;
  return { default: Booking };
});
import Booking from "../models/bookingModel.js";
import { createBooking, getBookings } from "../controllers/bookingController.js";

const body = { name: "Asha", email: "asha@x.com", phone: "9876543210", travelers: "3",
  specialRequests: "Veg", tourId: "01", tourTitle: "Westminster Bridge", totalPrice: "30000" };
beforeEach(() => { vi.clearAllMocks(); vi.spyOn(console, "error").mockImplementation(() => {}); });

const missing = [
  ["TC_BKG_01 (Path 1)", "name"], ["TC_BKG_02 (Path 2)", "email"], ["TC_BKG_03 (Path 3)", "phone"],
  ["TC_BKG_04 (Path 4)", "tourId"], ["TC_BKG_05 (Path 5)", "tourTitle"],
  ["TC_BKG_06 (Path 6)", "totalPrice"], ["TC_BKG_07 (Path 7)", "userId"],
];
describe("createBooking  V(G)=9", () => {
  for (const [id, field] of missing) {
    it(`${id} ${field} missing -> 400`, async () => {
      const b = { ...body }; const req = { body: b, userId: "u1" };
      if (field === "userId") req.userId = undefined; else delete b[field];
      const res = mockRes();
      await createBooking(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Missing required fields" });
      expect(Booking).not.toHaveBeenCalled();
    });
  }
  it("TC_BKG_08 (Path 8) all fields valid -> 201, saved as confirmed", async () => {
    m.save.mockResolvedValue({ _id: "b1", status: "confirmed" });
    const res = mockRes();
    await createBooking({ body, userId: "u1" }, res);
    expect(Booking).toHaveBeenCalledWith(expect.objectContaining({
      userId: "u1", travelers: 3, totalPrice: 30000, status: "confirmed" }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, booking: { _id: "b1", status: "confirmed" },
      message: "Booking created successfully" });
  });
  it("TC_BKG_09 (Path 9) database save fails -> 500", async () => {
    m.save.mockRejectedValue(new Error("Validation failed"));
    const res = mockRes();
    await createBooking({ body, userId: "u1" }, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Validation failed" });
  });
});

describe("getBookings  V(G)=2", () => {
  it("TC_GET_01 (Path 1) returns user's bookings newest first -> 200", async () => {
    m.sort.mockResolvedValue([{ _id: "b2" }, { _id: "b1" }]);
    m.find.mockReturnValue({ sort: m.sort });
    const res = mockRes();
    await getBookings({ userId: "u1" }, res);
    expect(m.find).toHaveBeenCalledWith({ userId: "u1" });
    expect(m.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, bookings: [{ _id: "b2" }, { _id: "b1" }] });
  });
  it("TC_GET_02 (Path 2) database error -> 400", async () => {
    m.find.mockImplementation(() => { throw new Error("DB down"); });
    const res = mockRes();
    await getBookings({ userId: "u1" }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "DB down" });
  });
});
