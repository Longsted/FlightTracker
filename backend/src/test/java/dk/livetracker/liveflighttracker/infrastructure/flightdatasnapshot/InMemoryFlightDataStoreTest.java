package dk.livetracker.liveflighttracker.infrastructure.flightdatasnapshot;

import static org.junit.jupiter.api.Assertions.*;
import static testutil.FlightTestDataFactory.createFlight;

import dk.livetracker.liveflighttracker.application.dto.FlightDataStatus;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InMemoryFlightDataStoreTest {

  private InMemoryFlightDataStore snapshotStore;

  @BeforeEach
  void setUp() {
    snapshotStore = new InMemoryFlightDataStore();
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

  @Test
  void getStatusReturnsInitialStatus() {
    // When
    FlightDataStatus status = snapshotStore.getStatus();

    // Then
    assertFalse(status.available());
    assertNull(status.lastAttempt());
    assertNull(status.lastSuccessfulUpdate());
  }

  @Test
  void recordRefreshSuccessUpdatesStatus() {
    // When
    snapshotStore.recordRefreshSuccess();

    // Then
    FlightDataStatus status = snapshotStore.getStatus();

    assertTrue(status.available());
    assertTrue(status.lastAttempt() != null);
    assertEquals(status.lastAttempt(), status.lastSuccessfulUpdate());
  }

  @Test
  void recordRefreshFailureUpdatesStatus() {
    // When
    snapshotStore.recordRefreshFailure();

    // Then
    FlightDataStatus status = snapshotStore.getStatus();

    assertFalse(status.available());
    assertTrue(status.lastAttempt() != null);
    assertEquals(null, status.lastSuccessfulUpdate());
  }

  @Test
  void recordRefreshFailurePreservesLastSuccessfulUpdate() {
    // Given
    snapshotStore.recordRefreshSuccess();
    Instant lastSuccessfulUpdate = snapshotStore.getStatus().lastSuccessfulUpdate();

    // When
    snapshotStore.recordRefreshFailure();

    // Then
    FlightDataStatus status = snapshotStore.getStatus();

    assertFalse(status.available());
    assertEquals(lastSuccessfulUpdate, status.lastSuccessfulUpdate());
    assertNotNull(status.lastAttempt());
  }
}
