package dk.livetracker.liveflighttracker.domain;

import java.time.Instant;

public record Flight(
    String icao24,
    String callsign,
    String originCountry,
    Instant timePosition,
    Instant lastContact,
    Double longitude,
    Double latitude,
    Double barometricAltitude,
    boolean onGround,
    Double velocity,
    Double heading,
    Double verticalRate) {
  public boolean hasPosition() {
    return longitude != null && latitude != null;
  }
}
