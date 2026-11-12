package dk.livetracker.liveflighttracker.infrastructure.flightdatasnapshot;

import dk.livetracker.liveflighttracker.application.interfaces.FlightSnapshotStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class InMemoryFlightSnapshotStore implements FlightSnapshotStore {
  private List<Flight> snapshot = List.of();

  @Override
  public List<Flight> getSnapshot() {
    return snapshot;
  }

  @Override
  public void updateSnapshot(List<Flight> flights) {
    this.snapshot = List.copyOf(Objects.requireNonNull(flights, "flights must not be null"));
  }
}
