package dk.livetracker.liveflighttracker.infrastructure.opensky.exception;

public class OpenSkyApiException extends RuntimeException {
    public OpenSkyApiException(String message) {
        super(message);
    }

    public OpenSkyApiException(String message, Throwable cause){
        super(message, cause);
    }
}
