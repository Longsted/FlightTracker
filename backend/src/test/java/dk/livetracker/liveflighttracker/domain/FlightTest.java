package dk.livetracker.liveflighttracker.domain;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FlightTest {

    @Test
    void hasPositionReturnsTrueWhenCoordinatesArePresent() {
        // Given
        Flight flight = createFlight(10.0, 55.0);

        // When
        boolean result = flight.hasPosition();

        // Then
        assertTrue(result);
    }

    @Test
    void hasPositionReturnsFalseWhenLongitudeIsNull() {
        // Given
        Flight flight = createFlight(null, 55.0);

        // When
        boolean result = flight.hasPosition();

        // Then
        assertFalse(result);
    }

    @Test
    void hasPositionReturnsFalseWhenLatitudeIsNull() {
        // Given
        Flight flight = createFlight(10.0, null);

        // When
        boolean result = flight.hasPosition();

        // Then
        assertFalse(result);
    }

    @Test
    void hasPositionReturnsFalseWhenBothCoordinatesAreNull() {
        // Given
        Flight flight = createFlight(null, null);

        // When
        boolean result = flight.hasPosition();

        // Then
        assertFalse(result);
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