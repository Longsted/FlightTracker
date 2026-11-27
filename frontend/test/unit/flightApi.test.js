import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getFlights,
  searchFlights,
  filterFlights,
  getFlightStatus,
} from "../../src/dashboard/flightApi.js";
import { API_ENDPOINTS } from "../helpers/testConstants.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getFlights", () => {
  it("returns flights when API request succeeds", async () => {
    // Given
    const flights = [{ icao24: "abc123" }];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(flights),
      }),
    );

    // When
    const result = await getFlights();

    // Then
    expect(result).toEqual(flights);
    expect(fetch).toHaveBeenCalledWith(API_ENDPOINTS.FLIGHTS);
  });

  it("throws an error when API request fails", async () => {
    // Given
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    // When & Then
    await expect(getFlights()).rejects.toThrow("HTTP error: 500");
  });
});

describe("searchFlights", () => {
  it("returns search results when API request succeeds", async () => {
    // Given
    const flights = [{ icao24: "abc123", callsign: "SAS123" }];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(flights),
      }),
    );

    // When
    const result = await searchFlights("SAS123");

    // Then
    expect(result).toEqual(flights);
  });

  it("sends the search query to the correct endpoint", async () => {
    // Given
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    );

    // When
    await searchFlights("SAS 123");

    // Then
    expect(fetch).toHaveBeenCalledWith(`${API_ENDPOINTS.SEARCH}?query=SAS+123`);
  });

  it("throws an error when API request fails", async () => {
    // Given
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    // When & Then
    await expect(searchFlights("SAS123")).rejects.toThrow("HTTP error: 500");
  });
});

describe("filterFlights", () => {
  it("propagates network errors", async () => {
    // Given
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    // When & Then
    await expect(
      filterFlights({}, new AbortController().signal),
    ).rejects.toThrow("Network error");
  });
  it("passes the abort signal to fetch when filtering flights", async () => {
    const controller = new AbortController();

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await filterFlights({ originCountry: "Denmark" }, controller.signal);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: controller.signal,
      }),
    );
  });
  it("throws an error when filtering returns HTTP 500", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(filterFlights({ originCountry: "Denmark" })).rejects.toThrow();
  });
});

describe("getFlightStatus", () => {
  it("returns flight status when API request succeeds", async () => {
    // Given
    const status = {
      available: true,
      lastSuccessfulUpdate: "2026-11-17T10:00:00Z",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(status),
      }),
    );

    // When
    const result = await getFlightStatus();

    // Then
    expect(result).toEqual(status);
    expect(fetch).toHaveBeenCalledWith(API_ENDPOINTS.FLIGHT_STATUS);
  });
});
