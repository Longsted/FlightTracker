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
      isRefreshing: false,
    pollInterval: null,

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

        document.addEventListener("visibilitychange",()=>{
            if(document.hidden){
                this.stopPolling();
            }else{
                this.refreshFlights()
                this.startPolling()
            }
        });
        console.info("Flight dashboard initialized")

        if(!document.hidden){
            this.startPolling()
        }
       await this.refreshFlights();


    },
      startPolling() {
          this.stopPolling();
          this.pollInterval = setInterval(() => {
              if (!document.hidden) {
                  this.refreshFlights();
              }
          }, 120000);
      },

      stopPolling() {
          if (this.pollInterval) {
              clearInterval(this.pollInterval);
              this.pollInterval = null;
          }
      },

    async refreshFlights() {
        if(this.isRefreshing){
            return;
        }
        this.isRefreshing = true;
        console.groupCollapsed("refrshing flight data")
      try {
        const result = await dashboardService.refreshFlightsWithRetry(
          this.selectedFlight,
          this.mapInitialized,
        );

        this.flights = result.flights;
        this.selectedFlight = result.selectedFlight;
        this.mapInitialized = result.mapInitialized;
        this.statusMessage = result.statusMessage;

          console.debug(`Received ${this.flights.length} flights`);
          console.debug("Flight data successfully updated");

      } catch (error) {
            console.groupCollapsed("flight data refresh failed");
        console.error("Failed to retrieve flights", error);
        console.groupEnd();
        this.statusMessage =
          this.flights.length > 0
            ? "Unable to retrieve latest flight data. Showing previous data."
            : "Flight data is currently unavailable";
      }
      finally {
          this.isRefreshing = false;
          console.groupEnd();
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
          console.groupCollapsed(`Flight search: "${query}"`);
          console.debug(`Found ${this.searchResults.length} matching flights`);
          console.groupEnd();
      } catch (error) {
          console.groupCollapsed(`Flight search failed: "${query}"`);
          console.error("Failed to search flights", error);
          console.groupEnd();
      }
    },

    clearSearch() {
      this.searchQuery = "";
      this.searchResults = [];
      this.searchPerformed = false;

      dashboardService.clearSearch();
    },

    selectFlight(flight) {
        console.info(`Selected flight: ${flight?.callsign?.trim() || flight?.icao24}`, flight);
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
