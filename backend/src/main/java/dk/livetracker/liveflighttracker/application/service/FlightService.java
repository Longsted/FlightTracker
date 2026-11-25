package dk.livetracker.liveflighttracker.application.service;

import dk.livetracker.liveflighttracker.application.dto.FlightDataStatus;
import dk.livetracker.liveflighttracker.application.dto.FlightFilter;
import dk.livetracker.liveflighttracker.application.filter.FlightFiltering;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FlightService {

  private static final Logger log = LoggerFactory.getLogger(FlightService.class);
  private final FlightDataProvider flightDataProvider;
  private final FlightDataStore flightDataStore;
  private final FlightFiltering flightFiltering;

  public FlightService(
      FlightDataProvider flightDataProvider,
      FlightDataStore flightDataStore,
      FlightFiltering flightFiltering) {
    this.flightDataProvider = flightDataProvider;
    this.flightDataStore = flightDataStore;
    this.flightFiltering = flightFiltering;
  }

  public List<Flight> getCurrentFlights() {
    return flightDataStore.getSnapshot().stream().filter(Flight::hasValidPosition).toList();
  }

  public void refreshFlights() {
    try {
      List<Flight> flights = flightDataProvider.getCurrentFlights();
      flightDataStore.updateSnapshot(flights);
      flightDataStore.recordRefreshSuccess();

      if(flights.isEmpty()){
        log.warn("snapshot refreshed, but provider returned 0 flights");
      }else{
        log.info("snapshot refreshed with {} flights",flights.size());
      }

    } catch (RuntimeException e) {
      {
        flightDataStore.recordRefreshFailure();
        throw e;
      }
    }
  }

  public List<Flight> searchFlights(String query) {

    if (query == null || query.isBlank()) {
      return List.of();
    }

    String searchTerm = query.trim().toLowerCase(Locale.ROOT);
    return getCurrentFlights().stream().filter(flight -> matches(flight, searchTerm)).toList();
  }

  public List<Flight> filterFlights(FlightFilter filter) {
    return flightFiltering.filter(getCurrentFlights(), filter);
  }

  private boolean matches(Flight flight, String searchTerm) {
    if (flight == null) {
      return false;
    }
    return containsIgnoreCase(flight.callsign(), searchTerm)
        || containsIgnoreCase(flight.icao24(), searchTerm);
  }

  private boolean containsIgnoreCase(String value, String searchTerm) {
    return value != null && value.toLowerCase(Locale.ROOT).contains(searchTerm);
  }

  public FlightDataStatus getFlightDataStatus() {
    return flightDataStore.getStatus();
  }
}
