export default class FlightDashboardService {
  constructor(flightApi, flightMap) {
    this.flightApi = flightApi;
    this.flightMap = flightMap;
    this.filterAbortController = null;
  }

  async refreshFlights(selectedFlight, mapInitialized) {
    const flights = await this.flightApi.getFlights();

    let flightStatus = null;

    if (!mapInitialized) {
      this.flightMap.createFlightMap(flights);
      mapInitialized = true;
    } else {
      this.flightMap.updateFlights(flights);
    }
    try {
      flightStatus = await this.flightApi.getFlightStatus();
    } catch (error) {
      console.error("Failed to retrieve flight data status", error);
    }

    if (selectedFlight) {
      selectedFlight =
        flights.find((flight) => flight.icao24 === selectedFlight.icao24) ??
        null;
    }

    let statusMessage;

    if (flightStatus && !flightStatus.available) {
      if (flightStatus.lastSuccessfulUpdate) {
        statusMessage =
          "Unable to retrieve latest flight data. Showing previous data.";
      } else {
        statusMessage = "Flight data is currently unavailable";
      }
    } else if (flights.length === 0) {
      statusMessage = "No flights currently available";
    } else {
      statusMessage = `Showing ${flights.length} flights`;
    }

    return {
      flights,
      selectedFlight,
      mapInitialized,
      statusMessage,
    };
  }

  async searchFlights(query) {
    const results = await this.flightApi.searchFlights(query);

    this.flightMap.highlightFlights(results.map((flight) => flight.icao24));

    return results;
  }

  async filterFlights(filters) {
    this.filterAbortController?.abort();

    const controller = new AbortController();
    this.filterAbortController = controller;

    try {
      const results = await this.flightApi.filterFlights(
        filters,
        controller.signal,
      );

      if (this.filterAbortController !== controller) {
        return null;
      }

      const flightIds = results.map((flight) => flight.icao24);
      this.flightMap.filterFlights(flightIds);
      return results;
    } catch (error) {
      if (error.name === "AbortError") {
        return null;
      }

      throw error;
    } finally {
      if (this.filterAbortController === controller) {
        this.filterAbortController = null;
      }
    }
  }

  clearFilters() {
    this.filterAbortController?.abort();
    this.filterAbortController = null;

    this.flightMap.clearFlightFilters();
  }

  clearSearch() {
    this.filterAbortController?.abort();
    this.filterAbortController = null;
    this.flightMap.clearFlightHighlights();
  }

  selectFlight(flight) {
    this.flightMap.zoomToFlight(flight);
  }
}
