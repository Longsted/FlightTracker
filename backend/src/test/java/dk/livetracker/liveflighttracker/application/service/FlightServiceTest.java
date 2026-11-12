package dk.livetracker.liveflighttracker.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightSnapshotStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FlightServiceTest {

  private FlightDataProvider provider;
  private FlightSnapshotStore snapshotStore;
  private FlightService service;

  @BeforeEach
  void setUp() {
    provider = mock(FlightDataProvider.class);
    snapshotStore = mock(FlightSnapshotStore.class);
    service = new FlightService(provider, snapshotStore);
  }

  @Test
  void getCurrentFlightsReturnsFlightsFromSnapshot() {
    // Given
    Flight flight = createFlight(10.0, 56.0);
    List<Flight> expectedFlights = List.of(flight);

    when(snapshotStore.getSnapshot()).thenReturn(expectedFlights);

    // When
    List<Flight> actualFlights = service.getCurrentFlights();

    // Then
    assertEquals(expectedFlights, actualFlights);
    verify(snapshotStore).getSnapshot();
  }

  @Test
  void getCurrentFlightsExcludesFlightsWithInvalidPosition() {
    // Given
    Flight validFlight = createFlight(10.0, 56.0);
    Flight missingPosition = createFlight(null, null);
    Flight invalidLongitude = createFlight(181.0, 56.0);
    Flight invalidLatitude = createFlight(10.0, 91.0);

    when(snapshotStore.getSnapshot())
        .thenReturn(List.of(validFlight, missingPosition, invalidLongitude, invalidLatitude));

    // When
    List<Flight> actualFlights = service.getCurrentFlights();

    // Then
    assertEquals(List.of(validFlight), actualFlights);
  }

  @Test
  void refreshFlightsFetchesFlightsAndUpdatesSnapshot() {
    // Given
    List<Flight> flights = List.of(createFlight(10.0, 56.0));
    when(provider.getCurrentFlights()).thenReturn(flights);

    // When
    service.refreshFlights();

    // Then
    verify(provider).getCurrentFlights();
    verify(snapshotStore).updateSnapshot(flights);
  }

  @Test
  void refreshFlightsDoesNotUpdateSnapshotWhenProviderFails() {
    // Given
    when(provider.getCurrentFlights()).thenThrow(new RuntimeException("Provider unavailable"));

    // When & Then
    org.junit.jupiter.api.Assertions.assertThrows(
        RuntimeException.class, () -> service.refreshFlights());

    org.mockito.Mockito.verifyNoInteractions(snapshotStore);
  }

  @Test
  void searchFlightsMatchesCallsign() {
    // Given
    Flight flight = createFlightWithIdentifiers("abc123", "SAS123");
    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When
    List<Flight> result = service.searchFlights("  sas  ");

    // Then
    assertEquals(List.of(flight), result);
  }

  @Test
  void searchFlightsMatchesIcao24() {
    // Given
    Flight flight = createFlightWithIdentifiers("4acb58", "SAS123");
    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When
    List<Flight> result = service.searchFlights("4ACB");

    // Then
    assertEquals(List.of(flight), result);
  }

  @Test
  void searchFlightsIsCaseInsensitive() {
    // Given
    Flight flight = createFlightWithIdentifiers("abc123", "SAS123");
    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When
    List<Flight> result = service.searchFlights("sas");

    // Then
    assertEquals(List.of(flight), result);
  }

  @Test
  void searchFlightsHandlesMissingIdentifiers() {
    // Given
    Flight flightWithMissingCallsign =
            createFlightWithIdentifiers("4acb58", null);

    Flight flightWithMissingIcao24 =
            createFlightWithIdentifiers(null, "KLM123");

    when(snapshotStore.getSnapshot()).thenReturn(
            List.of(flightWithMissingCallsign, flightWithMissingIcao24));

    // When
    List<Flight> result = service.searchFlights("4acb");

    // Then
    assertEquals(List.of(flightWithMissingCallsign), result);
  }

  @Test
  void searchFlightsReturnsEmptyWhenNoMatchOrQueryIsBlank() {
    // Given
    Flight flight = createFlightWithIdentifiers("abc123", "SAS123");
    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When & Then
    assertTrue(service.searchFlights("NOTFOUND").isEmpty());
    assertTrue(service.searchFlights("").isEmpty());
    assertTrue(service.searchFlights("   ").isEmpty());
    assertTrue(service.searchFlights(null).isEmpty());
  }



  private Flight createFlight(Double longitude, Double latitude) {
    return new Flight(
        "abc123",
        "SAS123",
        "Denmark",
        Instant.parse("2026-11-11T10:00:00Z"),
        Instant.parse("2026-11-11T10:00:00Z"),
        longitude,
        latitude,
        10000.0,
        false,
        250.0,
        180.0,
        0.0);
  }

  private Flight createFlightWithIdentifiers(String icao24, String callsign) {
    return new Flight(
            icao24,
            callsign,
            "Denmark",
            Instant.parse("2026-11-11T10:00:00Z"),
            Instant.parse("2026-11-11T10:00:00Z"),
            10.0,
            56.0,
            10000.0,
            false,
            250.0,
            180.0,
            0.0);
  }


}
