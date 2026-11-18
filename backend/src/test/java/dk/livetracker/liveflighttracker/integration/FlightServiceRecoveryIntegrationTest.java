package dk.livetracker.liveflighttracker.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataStore;
import dk.livetracker.liveflighttracker.application.service.FlightService;
import dk.livetracker.liveflighttracker.domain.Flight;
import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {"flight.refresh.interval-ms=3600000"})
public class FlightServiceRecoveryIntegrationTest {

  @Autowired private FlightService flightService;

  @Autowired private FlightDataStore flightDataStore;

  @MockitoBean private FlightDataProvider flightDataProvider;

  @Test
  void refreshFlightsRecoversAfterProviderFailure() {
    clearInvocations(flightDataProvider);
    // Given
    Flight initialFlight = createFlight("abc123", "SAS123");
    Flight recoveredFlight = createFlight("def456", "SAS456");

    when(flightDataProvider.getCurrentFlights())
        .thenReturn(List.of(initialFlight))
        .thenThrow(new FlightDataProviderException("Provider unavailable"))
        .thenReturn(List.of(recoveredFlight));

    // When -
    flightService.refreshFlights();

    // Then -
    assertEquals(List.of(initialFlight), flightDataStore.getSnapshot());
    assertTrue(flightDataStore.getStatus().available());

    // When - Provider fails
    assertThrows(FlightDataProviderException.class, () -> flightService.refreshFlights());

    // Then - Previous snapshot is preserved
    assertEquals(List.of(initialFlight), flightDataStore.getSnapshot());
    assertFalse(flightDataStore.getStatus().available());

    // When - Provider becomes available again
    flightService.refreshFlights();

    // Then - Snapshot is updated with new flight data
    assertEquals(List.of(recoveredFlight), flightDataStore.getSnapshot());
    assertTrue(flightDataStore.getStatus().available());

    verify(flightDataProvider, times(3)).getCurrentFlights();
  }

  private Flight createFlight(String icao24, String callsign) {
    return new Flight(
        icao24,
        callsign,
        "Denmark",
        Instant.ofEpochSecond(1730000000L),
        Instant.ofEpochSecond(1730000000L),
        10.7522,
        56.2639,
        10000.0,
        false,
        250.0,
        180.0,
        0.0);
  }
}
