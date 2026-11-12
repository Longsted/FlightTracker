package dk.livetracker.liveflighttracker.application.service;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightSnapshotStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
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
}
