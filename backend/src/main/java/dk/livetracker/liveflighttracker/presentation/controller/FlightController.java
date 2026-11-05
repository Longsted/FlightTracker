package dk.livetracker.liveflighttracker.presentation.controller;

import dk.livetracker.liveflighttracker.application.service.FlightService;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flights")
public class FlightController {

  private final FlightService flightService;

  public FlightController(FlightService flightService) {
    this.flightService = flightService;
  }

  @GetMapping
  public List<Flight> getFlights() {
    return flightService.getCurrentFlights();
  }
}
