package dk.livetracker.liveflighttracker.application.dto;

import java.time.Instant;

public record FlightDataStatus(
    boolean available, Instant lastAttempt, Instant lastSuccessfulUpdate) {
  public static FlightDataStatus initial() {
    return new FlightDataStatus(false, null, null);
  }

  public static FlightDataStatus success(Instant timestamp) {
    return new FlightDataStatus(true, timestamp, timestamp);
  }

  public FlightDataStatus withFailure(Instant timestamp) {
    return new FlightDataStatus(false, timestamp, lastSuccessfulUpdate);
  }
}
