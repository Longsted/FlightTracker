import { createFlightMap, updateFlights } from "../map/flightMap.js";

export default () => ({
  statusMessage: "Retrieving flight data",
  selectedFlight: null,
  mapInitialized: false,
  flightPanelOpen: false,

  async init() {
    window.addEventListener("asset-clicked", (event) => {
      this.selectedFlight = event.detail;
      this.flightPanelOpen = true;
    });
    await this.refreshFlights();

    //polling
    setInterval(() => {
      this.refreshFlights();
    }, 120000);
  },
  async refreshFlights() {
    try {
      const response = await fetch("/api/flights");

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const flights = await response.json();

      if (!this.mapInitialized) {
        createFlightMap(flights);
        this.mapInitialized = true;
      } else {
        updateFlights(flights);
      }

      if (this.selectedFlight) {
        const updatedFlight = flights.find(
          (flight) => flight.icao24 === this.selectedFlight.icao24,
        );
        this.selectedFlight = updatedFlight ?? null;
      }

      if (flights.length === 0) {
        this.statusMessage = "No flights currently available";
      } else {
        this.statusMessage = `Showing ${flights.length} flights`;
      }
    } catch (error) {
      console.error(`Failed to retrieve flights`, error);
      this.statusMessage = "Could not retrieve flight data";
    }
  },
});
