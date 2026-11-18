import { describe, it, expect, beforeEach, vi } from "vitest";
import FlightDashboardService from "../../src/dashboard/flightDashboardService.js";

describe("flightDashboardService", () => {
  let service;
  let flightApi;
  let flightMap;

  const flight1 = {
    icao24: "abc123",
    callsign: "SAS123",
  };

  const flight2 = {
    icao24: "def456",
    callsign: "DLH456",
  };

  beforeEach(() => {
    flightApi = {
      getFlights: vi.fn(),
      status: vi.fn(),
      searchFlights: vi.fn(),
      filterFlights: vi.fn(),
    };

    flightApi.status.mockResolvedValue({
      available: true,
      lastAttempt: "2026-11-17T10:00:00Z",
      lastSuccessfulUpdate: "2026-11-17T10:00:00Z",
    });

    flightMap = {
      createFlightMap: vi.fn(),
      updateFlights: vi.fn(),
      highlightFlights: vi.fn(),
      clearFlightHighlights: vi.fn(),
      zoomToFlight: vi.fn(),
      filterFlights: vi.fn(),
    };

    service = new FlightDashboardService(flightApi, flightMap);
  });

  describe("refreshFlights", () => {
    it("creates the map when it has not been initialized", async () => {
      flightApi.getFlights.mockResolvedValue([flight1]);

      const result = await service.refreshFlights(null, false);

      expect(flightMap.createFlightMap).toHaveBeenCalledWith([flight1]);
      expect(flightMap.updateFlights).not.toHaveBeenCalled();
      expect(result.mapInitialized).toBe(true);
    });

    it("updates the map when it is already initialized", async () => {
      flightApi.getFlights.mockResolvedValue([flight1]);

      const result = await service.refreshFlights(null, true);

      expect(flightMap.updateFlights).toHaveBeenCalledWith([flight1]);
      expect(flightMap.createFlightMap).not.toHaveBeenCalled();
      expect(result.mapInitialized).toBe(true);
    });

    it("preserves the selected flight with updated data", async () => {
      const updatedFlight = {
        ...flight1,
        callsign: "SAS456",
      };

      flightApi.getFlights.mockResolvedValue([updatedFlight]);

      const result = await service.refreshFlights(flight1, true);

      expect(result.selectedFlight).toEqual(updatedFlight);
    });

    it("clears the selected flight when it no longer exists", async () => {
      flightApi.getFlights.mockResolvedValue([flight2]);

      const result = await service.refreshFlights(flight1, true);

      expect(result.selectedFlight).toBeNull();
    });

    it("returns a status message when flights are available", async () => {
      flightApi.getFlights.mockResolvedValue([flight1, flight2]);

      const result = await service.refreshFlights(null, true);

      expect(result.statusMessage).toBe("Showing 2 flights");
    });

    it("returns a status message when no flights are available", async () => {
      flightApi.getFlights.mockResolvedValue([]);

      const result = await service.refreshFlights(null, true);

      expect(result.statusMessage).toBe("No flights currently available");
    });

    it("propagates API errors", async () => {
      const error = new Error("API unavailable");
      flightApi.getFlights.mockRejectedValue(error);

      await expect(service.refreshFlights(null, false)).rejects.toThrow(
        "API unavailable",
      );
    });

    it("shows a warning when flight data is unavailable but previous data exists", async () => {
      flightApi.getFlights.mockResolvedValue([flight1]);

      flightApi.status.mockResolvedValue({
        available: false,
        lastAttempt: "2026-11-17T10:00:00Z",
        lastSuccessfulUpdate: "2026-11-17T09:55:00Z",
      });

      const result = await service.refreshFlights(null, true);

      expect(result.statusMessage).toBe(
        "Unable to retrieve latest flight data. Showing previous data.",
      );

      expect(flightMap.updateFlights).toHaveBeenCalledWith([flight1]);
    });

    it("shows unavailable message when no previous flight data exists", async () => {
      flightApi.getFlights.mockResolvedValue([]);

      flightApi.status.mockResolvedValue({
        available: false,
        lastAttempt: "2026-11-17T10:00:00Z",
        lastSuccessfulUpdate: null,
      });

      const result = await service.refreshFlights(null, true);

      expect(result.statusMessage).toBe("Flight data is currently unavailable");

      expect(flightMap.updateFlights).toHaveBeenCalledWith([]);
    });
    it("shows unavailable message when no previous flight data exists", async () => {
      flightApi.getFlights.mockResolvedValue([]);

      flightApi.status.mockResolvedValue({
        available: false,
        lastAttempt: "2026-11-17T10:00:00Z",
        lastSuccessfulUpdate: null,
      });

      const result = await service.refreshFlights(null, true);

      expect(result.statusMessage).toBe("Flight data is currently unavailable");

      expect(flightMap.updateFlights).toHaveBeenCalledWith([]);
    });
    it("continues updating flights when status endpoint fails", async () => {
      flightApi.getFlights.mockResolvedValue([flight1]);

      flightApi.status.mockRejectedValue(
        new Error("Status endpoint unavailable"),
      );

      const result = await service.refreshFlights(null, true);

      expect(result.flights).toEqual([flight1]);
      expect(result.statusMessage).toBe("Showing 1 flights");
      expect(flightMap.updateFlights).toHaveBeenCalledWith([flight1]);
    });
  });

  describe("searchFlights", () => {
    it("returns search results and highlights matching flights", async () => {
      flightApi.searchFlights.mockResolvedValue([flight1, flight2]);

      const result = await service.searchFlights("SAS");

      expect(flightApi.searchFlights).toHaveBeenCalledWith("SAS");
      expect(flightMap.highlightFlights).toHaveBeenCalledWith([
        "abc123",
        "def456",
      ]);
      expect(result).toEqual([flight1, flight2]);
    });

    it("returns an empty result when no flights match", async () => {
      flightApi.searchFlights.mockResolvedValue([]);

      const result = await service.searchFlights("UNKNOWN");

      expect(result).toEqual([]);
      expect(flightMap.highlightFlights).toHaveBeenCalledWith([]);
    });

    it("propagates search errors", async () => {
      flightApi.searchFlights.mockRejectedValue(new Error("Search failed"));

      await expect(service.searchFlights("SAS")).rejects.toThrow(
        "Search failed",
      );
    });
  });

  describe("filterFlights", () => {
    it("filters flights and updates the map with matching flight IDs", async () => {
      // Given
      const filters = { originCountry: "Denmark" };
      flightApi.filterFlights.mockResolvedValue([flight1, flight2]);

      // When
      const result = await service.filterFlights(filters);

      // Then
      expect(flightApi.filterFlights).toHaveBeenCalledWith(
        filters,
        expect.any(AbortSignal),
      );

      expect(flightMap.filterFlights).toHaveBeenCalledWith([
        "abc123",
        "def456",
      ]);

      expect(result).toEqual([flight1, flight2]);
    });

    it("updates the map with an empty list when no flights match", async () => {
      // Given
      flightApi.filterFlights.mockResolvedValue([]);

      // When
      const result = await service.filterFlights({
        originCountry: "Unknown",
      });

      // Then
      expect(flightMap.filterFlights).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("propagates filtering errors", async () => {
      // Given
      flightApi.filterFlights.mockRejectedValue(new Error("Filtering failed"));

      // When & Then
      await expect(
        service.filterFlights({ originCountry: "Denmark" }),
      ).rejects.toThrow("Filtering failed");
    });

    it("returns null when filtering is aborted", async () => {
      // Given
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";

      flightApi.filterFlights.mockRejectedValue(abortError);

      // When
      const result = await service.filterFlights({});

      // Then
      expect(result).toBeNull();
      expect(flightMap.filterFlights).not.toHaveBeenCalled();
    });

    it("passes multiple filters to the API", async () => {
      const filters = {
        originCountry: "Denmark",
        onGround: false,
        callsign: "SAS",
      };

      flightApi.filterFlights.mockResolvedValue([flight1]);

      const result = await service.filterFlights(filters);

      expect(flightApi.filterFlights).toHaveBeenCalledWith(
        filters,
        expect.any(AbortSignal),
      );

      expect(result).toEqual([flight1]);
    });

    it("aborts the previous filtering request when a new one starts", async () => {
      let firstSignal;

      flightApi.filterFlights.mockImplementationOnce((_filters, signal) => {
        firstSignal = signal;

        return new Promise((resolve, reject) => {
          signal.addEventListener("abort", () => {
            const error = new Error("Request aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      });

      flightApi.filterFlights.mockResolvedValueOnce([flight2]);

      const firstRequest = service.filterFlights({
        originCountry: "Denmark",
      });

      const secondRequest = service.filterFlights({
        originCountry: "Germany",
      });

      await expect(firstRequest).resolves.toBeNull();
      await expect(secondRequest).resolves.toEqual([flight2]);

      expect(firstSignal.aborted).toBe(true);
      expect(flightMap.filterFlights).toHaveBeenCalledOnce();
      expect(flightMap.filterFlights).toHaveBeenCalledWith(["def456"]);
    });
  });

  describe("clearSearch", () => {
    it("clears flight highlights", () => {
      service.clearSearch();

      expect(flightMap.clearFlightHighlights).toHaveBeenCalledOnce();
    });
  });

  describe("selectFlight", () => {
    it("zooms to the selected flight", () => {
      service.selectFlight(flight1);

      expect(flightMap.zoomToFlight).toHaveBeenCalledWith(flight1);
    });
  });
});
