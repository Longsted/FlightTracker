package dk.livetracker.liveflighttracker.application.interfaces;

import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;

/** Provides access to flight data from an external data source. */
public interface FlightDataProvider {
  /**
   * Retrieves flight data from the configured data source.
   *
   * @return a list of successfully retrieved and mapped flights
   */
  List<Flight> getCurrentFlights();
}
