import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("react-toastify", () => ({ toast }));

import useBooking from "../src/hooks/useCreateBooking.js";
import { AppContext } from "../src/context/AppContext.jsx";

const tour = { id: "01", title: "Westminster Bridge", price: 10000 };
const setup = (user) => {
  const wrapper = ({ children }) => React.createElement(AppContext.Provider, { value: { user } }, children);
  return renderHook(() => useBooking(tour, vi.fn()), { wrapper });
};
const change = (r, name, value) => act(() => r.current.handleChange({ target: { name, value } }));
const submit = async (r) => act(async () => { await r.current.handleSubmit({ preventDefault() {} }); });

beforeEach(() => {
  vi.clearAllMocks(); localStorage.setItem("token", "tok123");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useBooking.handleSubmit  V(G)=6", () => {
  it("TC_FBK_01 (Path 1) name missing -> validation error, no request", async () => {
    global.fetch = vi.fn();
    const { result } = setup({ name: "", email: "a@x.com", phone: "999" });
    await submit(result);
    expect(toast.error).toHaveBeenCalledWith("Please fill out all required fields.");
    expect(fetch).not.toHaveBeenCalled(); expect(result.current.isSubmitting).toBe(false);
  });
  it("TC_FBK_02 (Path 2) email missing", async () => {
    global.fetch = vi.fn();
    const { result } = setup({ name: "Asha", email: "", phone: "999" });
    await submit(result);
    expect(toast.error).toHaveBeenCalledWith("Please fill out all required fields.");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("TC_FBK_03 (Path 3) phone missing", async () => {
    global.fetch = vi.fn();
    const { result } = setup({ name: "Asha", email: "a@x.com" });
    await submit(result);
    expect(toast.error).toHaveBeenCalledWith("Please fill out all required fields.");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("TC_FBK_04 (Path 4) network failure -> error toast", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network down"));
    const { result } = setup({ name: "Asha", email: "a@x.com" }); change(result, "phone", "9876543210");
    await submit(result);
    expect(toast.error).toHaveBeenCalledWith("Error: Network down");
    expect(result.current.isSubmitting).toBe(false);
  });
  it("TC_FBK_05 (Path 5) server rejects booking (response not ok) -> error toast", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ message: "Missing required fields" }) });
    const { result } = setup({ name: "Asha", email: "a@x.com" }); change(result, "phone", "9876543210");
    await submit(result);
    expect(toast.error).toHaveBeenCalledWith("Error: Missing required fields");
    expect(toast.success).not.toHaveBeenCalled();
  });
  it("TC_FBK_06 (Path 6) booking succeeds -> token sent, total = price x travelers, form reset", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ booking: { _id: "b1" } }) });
    const { result } = setup({ name: "Asha", email: "a@x.com" });
    change(result, "phone", "9876543210"); change(result, "travelers", "3");
    expect(result.current.totalPrice).toBe(30000);
    await submit(result);
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/bookings$/);
    expect(opts.headers.Authorization).toBe("Bearer tok123");
    expect(JSON.parse(opts.body)).toMatchObject({ tourId: "01", tourTitle: "Westminster Bridge", totalPrice: 30000 });
    expect(toast.success).toHaveBeenCalledWith("Booking successful!");
    expect(result.current.formData.travelers).toBe(1);
    expect(result.current.isSubmitting).toBe(false);
  });
});
