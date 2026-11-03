package dk.livetracker.liveflighttracker.infrastructure.opensky.mapper;

import dk.livetracker.liveflighttracker.domain.Flight;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStateVector;

import java.time.Instant;
import java.util.Objects;

public class OpenSkyStateVectorMapper {

    public Flight toFlight(OpenSkyStateVector stateVector) {

        Objects.requireNonNull(stateVector, "stateVector must not be null");
        return new Flight(
                stateVector.icao24(),
                stateVector.callsign(),
                stateVector.originCountry(),
                toInstant(stateVector.timePosition()),
                toInstant(stateVector.lastContact()),
                stateVector.longitude(),
                stateVector.latitude(),
                stateVector.barometricAltitude(),
                Boolean.TRUE.equals(stateVector.onGround()),
                stateVector.velocity(),
                stateVector.heading(),
                stateVector.verticalRate()
        );
    }

    private Instant toInstant(Long timestamp) {
        return timestamp == null ? null : Instant.ofEpochSecond(timestamp);
    }
}
