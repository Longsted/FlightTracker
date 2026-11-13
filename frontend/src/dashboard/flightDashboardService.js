export default class FlightDashboardService {
  constructor(flightApi, flightMap) {
    this.flightApi = flightApi;
    this.flightMap = flightMap;
  }

  async refreshFlights(selectedFlight, mapInitialized) {
    const flights = await this.flightApi.getFlights();

    if (!mapInitialized) {
      this.flightMap.createFlightMap(flights);
      mapInitialized = true;
    } else {
      this.flightMap.updateFlights(flights);
    }

    if (selectedFlight) {
      selectedFlight =
        flights.find((flight) => flight.icao24 === selectedFlight.icao24) ??
        null;
    }

    const statusMessage =
      flights.length === 0
        ? "No flights currently available"
        : `Showing ${flights.length} flights`;

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

  clearSearch() {
    this.flightMap.clearFlightHighlights();
  }

  selectFlight(flight) {
    this.flightMap.zoomToFlight(flight);
  }
}
