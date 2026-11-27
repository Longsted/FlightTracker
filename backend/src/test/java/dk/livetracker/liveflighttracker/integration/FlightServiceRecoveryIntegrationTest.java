package dk.livetracker.liveflighttracker.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataStore;
import dk.livetracker.liveflighttracker.application.service.FlightService;
import dk.livetracker.liveflighttracker.domain.Flight;
import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import testutil.FlightTestDataFactory;

@SpringBootTest(properties = {"flight.refresh.interval-ms=3600000"})
public class FlightServiceRecoveryIntegrationTest {

  @Autowired private FlightService flightService;

  @Autowired private FlightDataStore flightDataStore;

  @MockitoBean private FlightDataProvider flightDataProvider;

  @Test
  void refreshFlightsRecoversAfterProviderFailure() {
    clearInvocations(flightDataProvider);
    // Given
    Flight initialFlight = FlightTestDataFactory.createFlightWithIdentifiers("abc123", "SAS123");

    Flight recoveredFlight = FlightTestDataFactory.createFlightWithIdentifiers("def456", "SAS456");

    when(flightDataProvider.getCurrentFlights())
        .thenReturn(List.of(initialFlight))
        .thenThrow(new FlightDataProviderException("Provider unavailable"))
        .thenReturn(List.of(recoveredFlight));

    // When
    flightService.refreshFlights();

    // Then
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
}
