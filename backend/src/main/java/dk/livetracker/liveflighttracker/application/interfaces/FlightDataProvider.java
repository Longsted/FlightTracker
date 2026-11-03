package dk.livetracker.liveflighttracker.application.interfaces;

import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;

/** Provides access to current flight data. */
public interface FlightDataProvider {
  /**
   * Retrieves all currently available flights.
   *
   * @return a list of currently available flights
   */
  List<Flight> getCurrentFlights();
}
