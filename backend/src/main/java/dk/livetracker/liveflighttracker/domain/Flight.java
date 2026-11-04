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
  public boolean hasValidPosition() {
    return longitude != null
        && latitude != null
        && Double.isFinite(longitude)
        && Double.isFinite(latitude)
        && longitude >= -180
        && longitude <= 180
        && latitude >= -90
        && latitude <= 90;
  }
}
