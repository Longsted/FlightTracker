package dk.livetracker.liveflighttracker.infrastructure.flightdatasnapshot;

import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import dk.livetracker.liveflighttracker.application.service.FlightService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {"flight.refresh.interval-ms=1000"})
class FlightRefreshSchedulerIntegrationTest {

  @MockitoBean private FlightService flightService;

  @Test
  void schedulerAutomaticallyRefreshesFlights() {
    clearInvocations(flightService);

    verify(flightService, timeout(5000).atLeastOnce()).refreshFlights();
  }
}
