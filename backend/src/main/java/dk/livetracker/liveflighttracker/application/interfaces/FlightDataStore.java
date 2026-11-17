package dk.livetracker.liveflighttracker.application.interfaces;

import dk.livetracker.liveflighttracker.application.dto.FlightDataStatus;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;

/** Provides access to the latest snapshot of flight data. */
public interface FlightDataStore {

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

  /**
   * Retrieves the current status of flight data retrieval.
   *
   * @return the current flight data status
   */
  FlightDataStatus getStatus();

  /** Records a successful flight data refresh. */
  void recordRefreshSuccess();

  /** Records a failed flight data refresh. */
  void recordRefreshFailure();
}
