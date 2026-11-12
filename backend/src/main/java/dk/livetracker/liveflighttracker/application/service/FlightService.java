package dk.livetracker.liveflighttracker.application.service;

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

  public FlightService(
      FlightDataProvider flightDataProvider, FlightSnapshotStore flightSnapshotStore) {
    this.flightDataProvider = flightDataProvider;
    this.flightSnapshotStore = flightSnapshotStore;
  }

  public List<Flight> getCurrentFlights() {
    return flightSnapshotStore.getSnapshot().stream().filter(Flight::hasValidPosition).toList();
  }

  public void refreshFlights() {
    List<Flight> flights = flightDataProvider.getCurrentFlights();
    flightSnapshotStore.updateSnapshot(flights);
  }

  public List<Flight> searchFlights(String query){
    List<Flight> currentSnapshot = flightSnapshotStore.getSnapshot();

    if(query == null || query.isBlank()){
      return List.of();
    }

    String searchTerm = query.trim().toLowerCase(Locale.ROOT);
   return currentSnapshot.stream().filter(f-> matches(f,searchTerm)).toList();
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
