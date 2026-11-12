package dk.livetracker.liveflighttracker.infrastructure.exception;

public class FlightDataProviderException extends RuntimeException {
  public FlightDataProviderException(String message) {
    super(message);
  }

  public FlightDataProviderException(String message, Throwable cause) {
    super(message, cause);
  }
}
