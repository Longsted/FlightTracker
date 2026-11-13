import * as flightMap from "../map/flightMap.js";
import * as flightApi from "./flightApi.js";
import FlightDashboardService from "./FlightDashboardService.js";

export default () => {
  const dashboardService = new FlightDashboardService(flightApi, flightMap);

  return {
    statusMessage: "Retrieving flight data",
    selectedFlight: null,
    mapInitialized: false,
    flightPanelOpen: true,

    // Side panel visibility
    leftPanelOpen: true,
    rightPanelOpen: true,

    // Flight data and search
    flights: [],
    searchQuery: "",
    searchResults: [],
    searchPerformed: false,

    get displayedFlights() {
      return this.searchPerformed ? this.searchResults : this.flights;
    },

    async init() {
      window.addEventListener("asset-clicked", (event) => {
        this.selectedFlight = event.detail;
        this.flightPanelOpen = true;
      });

      await this.refreshFlights();

      setInterval(() => {
        this.refreshFlights();
      }, 120000);
    },

    async refreshFlights() {
      try {
        const result = await dashboardService.refreshFlights(
          this.selectedFlight,
          this.mapInitialized,
        );

        this.flights = result.flights;
        this.selectedFlight = result.selectedFlight;
        this.mapInitialized = result.mapInitialized;
        this.statusMessage = result.statusMessage;
      } catch (error) {
        console.error("Failed to retrieve flights", error);
        this.statusMessage = "Could not retrieve flight data";
      }
    },

    async searchFlights() {
      const query = this.searchQuery.trim();

      if (!query) {
        this.clearSearch();
        return;
      }

      try {
        this.searchResults = await dashboardService.searchFlights(query);

        this.searchPerformed = true;
      } catch (error) {
        console.error("Failed to search flights", error);
      }
    },

    clearSearch() {
      this.searchQuery = "";
      this.searchResults = [];
      this.searchPerformed = false;

      dashboardService.clearSearch();
    },

    selectFlight(flight) {
      this.selectedFlight = flight;
      this.flightPanelOpen = true;

      dashboardService.selectFlight(flight);
    },

    clearSelectedFlight() {
      this.selectedFlight = null;
    },
  };
};
