package dk.livetracker.liveflighttracker.domain;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static testutil.FlightTestDataFactory.createFlight;

import org.junit.jupiter.api.Test;

class FlightTest {

  @Test
  void hasValidPositionReturnsTrueWhenCoordinatesAreValid() {
    // Given
    Flight flight = createFlight(10.0, 55.0);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertTrue(result);
  }

  @Test
  void hasValidPositionReturnsFalseWhenLongitudeIsNull() {
    // Given
    Flight flight = createFlight(null, 55.0);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertFalse(result);
  }

  @Test
  void hasValidPositionReturnsFalseWhenLatitudeIsNull() {
    // Given
    Flight flight = createFlight(10.0, null);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertFalse(result);
  }

  @Test
  void hasValidPositionReturnsFalseWhenLongitudeIsOutOfRange() {
    // Given
    Flight flight = createFlight(181.0, 55.0);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertFalse(result);
  }

  @Test
  void hasValidPositionReturnsFalseWhenLatitudeIsOutOfRange() {
    // Given
    Flight flight = createFlight(10.0, 91.0);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertFalse(result);
  }

  @Test
  void hasValidPositionReturnsFalseWhenCoordinateIsNaN() {
    // Given
    Flight flight = createFlight(Double.NaN, 55.0);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertFalse(result);
  }

  @Test
  void hasValidPositionReturnsFalseWhenCoordinateIsInfinite() {
    // Given
    Flight flight = createFlight(10.0, Double.POSITIVE_INFINITY);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertFalse(result);
  }

  @Test
  void hasValidPositionReturnsTrueWhenCoordinatesAreAtBoundaries() {
    // Given
    Flight flight = createFlight(-180.0, 90.0);

    // When
    boolean result = flight.hasValidPosition();

    // Then
    assertTrue(result);
  }
}
