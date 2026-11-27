package testutil;

import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;

public class FlightTestDataFactory {

  private FlightTestDataFactory() {
    // no instansiation
  }

  public static Flight createFlight(Double longitude, Double latitude) {
    return new Flight(
        "4acb43",
        "SAS1665",
        "Sweden",
        Instant.parse("2026-11-11T10:00:00Z"),
        Instant.parse("2026-11-11T10:00:00Z"),
        longitude,
        latitude,
        5440.68,
        false,
        179.72,
        135.93,
        17.88);
  }

  public static Flight createFlight(
      String country,
      Double altitude,
      Double velocity,
      boolean onGround,
      Double longitude,
      Double latitude) {

    return new Flight(
        "abc123",
        "SAS123",
        country,
        Instant.parse("2026-11-11T10:00:00Z"),
        Instant.parse("2026-11-11T10:00:00Z"),
        longitude,
        latitude,
        altitude,
        onGround,
        velocity,
        180.0,
        0.0);
  }

  public static Flight createFlightWithIdentifiers(String icao24, String callsign) {
    return new Flight(
        icao24,
        callsign,
        "Denmark",
        Instant.parse("2026-11-11T10:00:00Z"),
        Instant.parse("2026-11-11T10:00:00Z"),
        10.0,
        56.0,
        10000.0,
        false,
        250.0,
        180.0,
        0.0);
  }

  public static Flight createFlight() {
    return new Flight(
        "abc123", "SAS123", "Denmark", null, null, 10.0, 56.0, 10000.0, false, 200.0, 180.0, 0.0);
  }

  public static Flight createSingleFlight() {
    return new Flight(
        "abc123", "SAS123", "Denmark", null, null, 10.0, 56.0, null, false, null, null, null);
  }
}
