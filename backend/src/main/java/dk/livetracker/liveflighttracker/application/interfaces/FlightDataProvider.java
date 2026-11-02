package dk.livetracker.liveflighttracker.application.interfaces;

import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;

/**
 * Provides access to current flight data.
 */
public interface FlightDataProvider {
    /**
     * Retrieves all currently available flights.
     *
     * @return a list of currently available flights
     */
    List<Flight> getCurrentFlights();
    /**
     * Retrieves flights within a specified geographic area.
     *
     * @param minLongitude western boundary of the area
     * @param minLatitude southern boundary of the area
     * @param maxLongitude eastern boundary of the area
     * @param maxLatitude northern boundary of the area
     * @return a list of flights within the specified area
     */
    List<Flight> getFlightsInArea(double minLongitude, double minLatitude,
            double maxLongitude, double maxLatitude
    );
}
