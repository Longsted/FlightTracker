package dk.livetracker.liveflighttracker.infrastructure.flightdatasnapshot;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InMemoryFlightSnapshotStoreTest {

  private InMemoryFlightSnapshotStore snapshotStore;

  @BeforeEach
  void setUp() {
    snapshotStore = new InMemoryFlightSnapshotStore();
  }

  @Test
  void updateSnapshotStoresFlights() {
    // Given
    List<Flight> flights = List.of(createFlight());

    // When
    snapshotStore.updateSnapshot(flights);

    // Then
    assertEquals(flights, snapshotStore.getSnapshot());
  }

  @Test
  void updateSnapshotStoresEmptyList() {
    // Given
    List<Flight> flights = List.of(createFlight());
    snapshotStore.updateSnapshot(flights);

    // When
    snapshotStore.updateSnapshot(List.of());

    // Then
    assertEquals(List.of(), snapshotStore.getSnapshot());
  }

  @Test
  void updateSnapshotRejectsNullAndPreservesPreviousSnapshot() {
    // Given
    List<Flight> flights = List.of(createFlight());
    snapshotStore.updateSnapshot(flights);

    // When & Then
    assertThrows(NullPointerException.class, () -> snapshotStore.updateSnapshot(null));

    assertEquals(flights, snapshotStore.getSnapshot());
  }

  private Flight createFlight() {
    return new Flight(
        "abc123", "SAS123", "Denmark", null, null, 10.0, 56.0, 10000.0, false, 200.0, 180.0, 0.0);
  }
}
