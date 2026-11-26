package dk.livetracker.liveflighttracker.application.filter;

import static org.junit.jupiter.api.Assertions.*;
import static testutil.FlightTestDataFactory.createFlight;

import dk.livetracker.liveflighttracker.application.dto.FlightFilter;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FlightFilteringTest {

  private FlightFiltering flightFiltering;

  @BeforeEach
  void setUp() {
    flightFiltering = new FlightFiltering();
  }

  @Test
  void filterReturnsAllFlightsWhenNoFiltersAreActive() {
    // Given
    Flight flight1 = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);
    Flight flight2 = createFlight("Germany", 8000.0, 200.0, false, 11.0, 55.0);

    List<Flight> flights = List.of(flight1, flight2);

    // When
    List<Flight> result = flightFiltering.filter(flights, emptyFilter());

    // Then
    assertEquals(flights, result);
  }

  @Test
  void filterReturnsEmptyListWhenFilterIsNull() {
    // Given
    List<Flight> flights = List.of(createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0));

    // When
    List<Flight> result = flightFiltering.filter(flights, null);

    // Then
    assertTrue(result.isEmpty());
  }

  @Test
  void filterFiltersByOriginCountry() {
    // Given
    Flight denmarkFlight = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);
    Flight germanyFlight = createFlight("Germany", 8000.0, 200.0, false, 11.0, 55.0);

    FlightFilter filter =
        new FlightFilter("Denmark", null, null, null, null, null, null, null, null, null);

    // When
    List<Flight> result = flightFiltering.filter(List.of(denmarkFlight, germanyFlight), filter);

    // Then
    assertEquals(List.of(denmarkFlight), result);
  }

  @Test
  void filterFiltersByAltitudeAndVelocity() {
    // Given
    Flight matchingFlight = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);
    Flight wrongAltitude = createFlight("Denmark", 3000.0, 250.0, false, 10.0, 56.0);
    Flight wrongVelocity = createFlight("Denmark", 10000.0, 400.0, false, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter(null, 5000.0, 12000.0, 150.0, 300.0, null, null, null, null, null);

    // When
    List<Flight> result =
        flightFiltering.filter(List.of(matchingFlight, wrongAltitude, wrongVelocity), filter);

    // Then
    assertEquals(List.of(matchingFlight), result);
  }

  @Test
  void filterFiltersByFlightStatus() {
    // Given
    Flight onGround = createFlight("Denmark", 0.0, 0.0, true, 10.0, 56.0);
    Flight airborne = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter(null, null, null, null, null, false, null, null, null, null);

    // When
    List<Flight> result = flightFiltering.filter(List.of(onGround, airborne), filter);

    // Then
    assertEquals(List.of(airborne), result);
  }

  @Test
  void filterFiltersByGeographicalArea() {
    // Given
    Flight insideArea = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);
    Flight outsideArea = createFlight("Germany", 10000.0, 250.0, false, 20.0, 60.0);

    FlightFilter filter =
        new FlightFilter(null, null, null, null, null, null, 8.0, 13.0, 54.0, 58.0);

    // When
    List<Flight> result = flightFiltering.filter(List.of(insideArea, outsideArea), filter);

    // Then
    assertEquals(List.of(insideArea), result);
  }

  @Test
  void filterCombinesMultipleCriteria() {
    // Given
    Flight matchingFlight = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);

    Flight wrongCountry = createFlight("Germany", 10000.0, 250.0, false, 10.0, 56.0);

    Flight wrongAltitude = createFlight("Denmark", 3000.0, 250.0, false, 10.0, 56.0);

    Flight wrongStatus = createFlight("Denmark", 10000.0, 250.0, true, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter("Denmark", 5000.0, 12000.0, 150.0, 300.0, false, 8.0, 13.0, 54.0, 58.0);

    // When
    List<Flight> result =
        flightFiltering.filter(
            List.of(matchingFlight, wrongCountry, wrongAltitude, wrongStatus), filter);

    // Then
    assertEquals(List.of(matchingFlight), result);
  }

  @Test
  void filterExcludesFlightsWithMissingAltitude() {
    // Given
    Flight missingAltitude = createFlight("Denmark", null, 250.0, false, 10.0, 56.0);

    Flight validAltitude = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter(null, 5000.0, null, null, null, null, null, null, null, null);

    // When
    List<Flight> result = flightFiltering.filter(List.of(missingAltitude, validAltitude), filter);

    // Then
    assertEquals(List.of(validAltitude), result);
  }

  @Test
  void filterExcludesFlightsWithInvalidCoordinates() {
    // Given
    Flight invalidCoordinates = createFlight("Denmark", 10000.0, 250.0, false, 181.0, 56.0);

    Flight validCoordinates = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter(null, null, null, null, null, null, 8.0, 13.0, 54.0, 58.0);

    // When
    List<Flight> result =
        flightFiltering.filter(List.of(invalidCoordinates, validCoordinates), filter);

    // Then
    assertEquals(List.of(validCoordinates), result);
  }

  @Test
  void filterIncludesFlightsAtAltitudeBoundaries() {
    // Given
    Flight atMinimum = createFlight("Denmark", 5000.0, 250.0, false, 10.0, 56.0);

    Flight atMaximum = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);

    Flight outsideRange = createFlight("Denmark", 12000.0, 250.0, false, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter(null, 5000.0, 10000.0, null, null, null, null, null, null, null);

    // When
    List<Flight> result =
        flightFiltering.filter(List.of(atMinimum, atMaximum, outsideRange), filter);

    // Then
    assertEquals(List.of(atMinimum, atMaximum), result);
  }

  @Test
  void filterMatchesOriginCountryRegardlessOfCase() {
    // Given
    Flight flight = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter("DENMARK", null, null, null, null, null, null, null, null, null);

    // When
    List<Flight> result = flightFiltering.filter(List.of(flight), filter);

    // Then
    assertEquals(List.of(flight), result);
  }

  @Test
  void filterExcludesFlightsWithMissingVelocity() {
    // Given
    Flight missingVelocity = createFlight("Denmark", 10000.0, null, false, 10.0, 56.0);
    Flight validVelocity = createFlight("Denmark", 10000.0, 250.0, false, 10.0, 56.0);

    FlightFilter filter =
        new FlightFilter(null, null, null, 150.0, 300.0, null, null, null, null, null);

    // When
    List<Flight> result = flightFiltering.filter(List.of(missingVelocity, validVelocity), filter);

    // Then
    assertEquals(List.of(validVelocity), result);
  }

  private FlightFilter emptyFilter() {
    return new FlightFilter(null, null, null, null, null, null, null, null, null, null);
  }
}
