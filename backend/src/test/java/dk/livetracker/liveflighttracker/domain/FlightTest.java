package dk.livetracker.liveflighttracker.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FlightTest {

    @Test
    void hasPositionReturnsTrueWhenCoordinatesArePresent() {
        Flight flight = createFlight(10.0, 55.0);

        assertTrue(flight.hasPosition());
    }

    @Test
    void hasPositionReturnsFalseWhenLongitudeIsNull() {
        Flight flight = createFlight(null, 55.0);

        assertFalse(flight.hasPosition());
    }

    @Test
    void hasPositionReturnsFalseWhenLatitudeIsNull() {
        Flight flight = createFlight(10.0, null);

        assertFalse(flight.hasPosition());
    }

    @Test
    void hasPositionReturnsFalseWhenBothCoordinatesAreNull() {
        Flight flight = createFlight(null, null);

        assertFalse(flight.hasPosition());
    }

    private Flight createFlight(Double longitude, Double latitude) {
        return new Flight(
                "4acb43",
                "SAS1665",
                "Sweden",
                Instant.now(),
                Instant.now(),
                longitude,
                latitude,
                5440.68,
                false,
                179.72,
                135.93,
                17.88
        );
    }
}