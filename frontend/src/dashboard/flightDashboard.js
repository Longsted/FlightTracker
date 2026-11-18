import * as flightMap from "../map/flightMap.js";
import * as flightApi from "./flightApi.js";
import FlightDashboardService from "./flightDashboardService.js";

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

    //flight filters
    originCountry: "",
    minAltitude: "",
    maxAltitude: "",
    minVelocity: "",
    maxVelocity: "",
    onGround: "",
    visibleAreaOnly: false,
    filteredFlights: [],
    filtersApplied: false,

    filterTimeout: null,

    get displayedFlights() {
      if (this.searchPerformed) {
        return this.searchResults;
      }

      if (this.filtersApplied) {
        return this.filteredFlights;
      }

      return this.flights;
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

        this.statusMessage =
          this.flights.length > 0
            ? "Unable to retrieve latest flight data. Showing previous data."
            : "Flight data is currently unavailable";
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

    scheduleFilterUpdate() {
      clearTimeout(this.filterTimeout);

      this.filterTimeout = setTimeout(() => {
        this.applyFilters();
      }, 300);
    },

    async applyFilters() {
      const filters = {
        originCountry: this.originCountry,
        minAltitude: this.minAltitude,
        maxAltitude: this.maxAltitude,
        minVelocity: this.minVelocity,
        maxVelocity: this.maxVelocity,
        onGround: this.onGround === "" ? "" : this.onGround === "true",
      };

      try {
        const results = await dashboardService.filterFlights(filters);

        if (results !== null) {
          this.filteredFlights = results;
          this.filtersApplied = true;
        }
      } catch (error) {
        console.error("Failed to filter flights", error);
      }
    },
    clearFilters() {
      clearTimeout(this.filterTimeout);
      this.filterTimeout = null;

      this.originCountry = "";
      this.minAltitude = "";
      this.maxAltitude = "";
      this.minVelocity = "";
      this.maxVelocity = "";
      this.onGround = "";
      this.visibleAreaOnly = false;
      this.filteredFlights = [];
      this.filtersApplied = false;

      dashboardService.clearFilters();
    },
    get availableCountries() {
      return [
        ...new Set(
          this.flights
            .map((flight) => flight.originCountry)
            .filter((country) => country),
        ),
      ].sort();
    },
  };
};
