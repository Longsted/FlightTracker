package dk.livetracker.liveflighttracker.application.service;

import dk.livetracker.liveflighttracker.application.dto.FlightFilter;
import dk.livetracker.liveflighttracker.application.filter.FlightFiltering;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightSnapshotStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class FlightService {

  private final FlightDataProvider flightDataProvider;
  private final FlightSnapshotStore flightSnapshotStore;
  private final FlightFiltering flightFiltering;

  public FlightService(
      FlightDataProvider flightDataProvider,
      FlightSnapshotStore flightSnapshotStore,
      FlightFiltering flightFiltering) {
    this.flightDataProvider = flightDataProvider;
    this.flightSnapshotStore = flightSnapshotStore;
    this.flightFiltering = flightFiltering;
  }

  public List<Flight> getCurrentFlights() {
    return flightSnapshotStore.getSnapshot().stream().filter(Flight::hasValidPosition).toList();
  }

  public void refreshFlights() {
    List<Flight> flights = flightDataProvider.getCurrentFlights();
    flightSnapshotStore.updateSnapshot(flights);
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
}
