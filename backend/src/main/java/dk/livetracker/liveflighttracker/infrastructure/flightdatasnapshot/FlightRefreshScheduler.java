package dk.livetracker.liveflighttracker.infrastructure.flightdatasnapshot;

import dk.livetracker.liveflighttracker.application.service.FlightService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FlightRefreshScheduler {

  private final FlightService flightService;
  private static final Logger log = LoggerFactory.getLogger(FlightRefreshScheduler.class);

  public FlightRefreshScheduler(FlightService flightService) {
    this.flightService = flightService;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void initialRefresh() {
    refreshFlightsSafely();
  }

  @Scheduled(fixedDelayString = "${flight.refresh.interval-ms}")
  public void scheduledRefresh() {
    refreshFlightsSafely();
  }

  private void refreshFlightsSafely() {
    try {
      flightService.refreshFlights();
      log.debug("Flight snapshot successfully refreshed.");
    } catch (RuntimeException e) {
      log.error("Failed to refresh flight snapshot. Keeping previous snapshot.", e);
    }
  }
}
