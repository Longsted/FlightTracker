import { describe, it, expect, beforeEach, vi } from "vitest";
import FlightDashboardService from "../../src/dashboard/FlightDashboardService.js";

describe("FlightDashboardService", () => {
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
      searchFlights: vi.fn(),
    };

    flightMap = {
      createFlightMap: vi.fn(),
      updateFlights: vi.fn(),
      highlightFlights: vi.fn(),
      clearFlightHighlights: vi.fn(),
      zoomToFlight: vi.fn(),
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
