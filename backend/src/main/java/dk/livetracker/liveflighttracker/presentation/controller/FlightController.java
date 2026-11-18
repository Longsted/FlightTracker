package dk.livetracker.liveflighttracker.presentation.controller;

import dk.livetracker.liveflighttracker.application.dto.FlightDataStatus;
import dk.livetracker.liveflighttracker.application.dto.FlightFilter;
import dk.livetracker.liveflighttracker.application.service.FlightService;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import org.springframework.web.bind.annotation.*;

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

  @GetMapping("/search")
  public List<Flight> searchFlights(@RequestParam String query) {
    return flightService.searchFlights(query);
  }

  @GetMapping("/filter")
  public List<Flight> filterFlights(@ModelAttribute FlightFilter filter) {
    return flightService.filterFlights(filter);
  }

  @GetMapping("/status")
  public FlightDataStatus getFlightDataStatus() {
    return flightService.getFlightDataStatus();
  }
}
