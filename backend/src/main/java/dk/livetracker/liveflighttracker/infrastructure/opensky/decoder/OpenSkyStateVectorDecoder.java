package dk.livetracker.liveflighttracker.infrastructure.opensky.decoder;

import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStateVector;
import dk.livetracker.liveflighttracker.infrastructure.opensky.exception.OpenSkyApiException;

import java.util.List;

public class OpenSkyStateVectorDecoder {

    public OpenSkyStateVector decode(List<Object> state) {

        if (state == null || state.size() < 12) {
            throw new OpenSkyApiException("Invalid OpenSky state vector");
        }
        String icao24 = (String) state.get(0);
        String callsign = (String) state.get(1);
        String originCountry = (String) state.get(2);

        Long timePosition = toLong(state.get(3));
        Long lastContact = toLong(state.get(4));

        Double longitude = toDouble(state.get(5));
        Double latitude = toDouble(state.get(6));
        Double barometricAltitude = toDouble(state.get(7));

        Boolean onGround = (Boolean) state.get(8);

        Double velocity = toDouble(state.get(9));
        Double heading = toDouble(state.get(10));
        Double verticalRate = toDouble(state.get(11));

        return new OpenSkyStateVector(
                icao24,
                callsign,
                originCountry,
                timePosition,
                lastContact,
                longitude,
                latitude,
                barometricAltitude,
                onGround,
                velocity,
                heading,
                verticalRate
        );
    }

    private Long toLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    private Double toDouble(Object value) {
        return value == null ? null : ((Number) value).doubleValue();
    }
}
