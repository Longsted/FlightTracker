package dk.livetracker.liveflighttracker.application.service;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.domain.Flight;

import java.util.List;

public class FlightService {

    private final FlightDataProvider flightDataProvider;

    public FlightService(FlightDataProvider flightDataProvider) {
        this.flightDataProvider = flightDataProvider;
    }

    public List<Flight> getCurrentFlights(){
        return flightDataProvider.getCurrentFlights();
    }

    public List<Flight> getFlightsInArea(double minLongitude, double minLatitude,
                                            double maxLongitude, double maxLatitude)
    {
        return flightDataProvider.getFlightsInArea(minLongitude, minLatitude,
                                                    maxLongitude, maxLatitude
        );
    }
}
