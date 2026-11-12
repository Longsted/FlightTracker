package dk.livetracker.liveflighttracker.infrastructure.flightdatasnapshot;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import dk.livetracker.liveflighttracker.application.service.FlightService;
import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FlightRefreshSchedulerTest {

  private FlightService flightService;
  private FlightRefreshScheduler scheduler;

  @BeforeEach
  void setUp() {
    flightService = mock(FlightService.class);
    scheduler = new FlightRefreshScheduler(flightService);
  }

  @Test
  void initialRefreshCallsFlightService() {
    scheduler.initialRefresh();

    verify(flightService).refreshFlights();
  }

  @Test
  void scheduledRefreshCallsFlightService() {
    scheduler.scheduledRefresh();

    verify(flightService).refreshFlights();
  }

  @Test
  void initialRefreshHandlesFlightDataProviderException() {
    doThrow(new FlightDataProviderException("Provider unavailable"))
        .when(flightService)
        .refreshFlights();

    assertDoesNotThrow(() -> scheduler.initialRefresh());

    verify(flightService).refreshFlights();
  }
}
