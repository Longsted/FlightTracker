import { describe, it, expect, vi, afterEach } from "vitest";
import { getFlights, searchFlights } from "../../src/dashboard/flightApi.js";

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
    expect(fetch).toHaveBeenCalledWith("/api/flights");
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
      expect(fetch).toHaveBeenCalledWith("/api/flights/search?query=SAS+123");
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
});
