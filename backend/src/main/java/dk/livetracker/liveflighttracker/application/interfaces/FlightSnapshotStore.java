package dk.livetracker.liveflighttracker.application.interfaces;

import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;

/** Provides access to the latest snapshot of flight data. */
public interface FlightSnapshotStore {

  /**
   * Retrieves the latest stored flight snapshot.
   *
   * @return a list of flights from the latest snapshot
   */
  List<Flight> getSnapshot();

  /**
   * Replaces the currently stored snapshot with a new one.
   *
   * @param flights the new snapshot of flights
   */
  void updateSnapshot(List<Flight> flights);
}
