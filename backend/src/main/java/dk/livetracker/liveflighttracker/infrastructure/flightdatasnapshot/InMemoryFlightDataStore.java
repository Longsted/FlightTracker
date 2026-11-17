package dk.livetracker.liveflighttracker.infrastructure.flightdatasnapshot;

import dk.livetracker.liveflighttracker.application.dto.FlightDataStatus;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Component;

@Component
public class InMemoryFlightDataStore implements FlightDataStore {
  private volatile List<Flight> snapshot = List.of();

  private volatile FlightDataStatus status = FlightDataStatus.initial();

  @Override
  public List<Flight> getSnapshot() {
    return snapshot;
  }

  @Override
  public void updateSnapshot(List<Flight> flights) {
    this.snapshot = List.copyOf(Objects.requireNonNull(flights, "flights must not be null"));
  }

  @Override
  public FlightDataStatus getStatus() {
    return status;
  }

  @Override
  public void recordRefreshSuccess() {
    Instant now = Instant.now();
    status = FlightDataStatus.success(now);
  }

  @Override
  public void recordRefreshFailure() {
    Instant now = Instant.now();
    status = status.withFailure(now);
  }
}
