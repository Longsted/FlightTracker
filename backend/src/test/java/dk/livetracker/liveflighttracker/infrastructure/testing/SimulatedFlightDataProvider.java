package dk.livetracker.liveflighttracker.infrastructure.testing;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("e2e")
public class SimulatedFlightDataProvider implements FlightDataProvider {

  @Override
  public List<Flight> getCurrentFlights() {
    Instant now = Instant.parse("2026-11-16T10:00:00Z");

    return List.of(
        new Flight(
            "abc123", "SAS123", "Denmark", now, now, 10.7522, 55.6181, 10000.0, false, 230.0, 90.0,
            0.0),
        new Flight(
            "def456", "DLH456", "Germany", now, now, 12.5683, 55.6761, 11000.0, false, 245.0, 180.0,
            0.0),
        new Flight(
            "ghi789",
            "BAW789",
            "United Kingdom",
            now,
            now,
            9.8492,
            56.0444,
            9000.0,
            false,
            220.0,
            270.0,
            0.0));
  }
}
