package dk.livetracker.liveflighttracker.infrastructure.opensky.decoder;

import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStateVector;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OpenSkyStateVectorDecoder {

  public OpenSkyStateVector decode(List<Object> state) {

    if (state == null || state.size() < 12) {
      throw new FlightDataProviderException("Invalid OpenSky state vector");
    }
    String icao24 = decodeValue(state.get(0), String.class);
    String callsign = decodeValue(state.get(1), String.class);
    String originCountry = decodeValue(state.get(2), String.class);

    Long timePosition = decodeValue(state.get(3), Long.class);
    Long lastContact = decodeValue(state.get(4), Long.class);

    Double longitude = decodeValue(state.get(5), Double.class);
    Double latitude = decodeValue(state.get(6), Double.class);
    Double barometricAltitude = decodeValue(state.get(7), Double.class);

    Boolean onGround = decodeValue(state.get(8), Boolean.class);

    Double velocity = decodeValue(state.get(9), Double.class);
    Double heading = decodeValue(state.get(10), Double.class);
    Double verticalRate = decodeValue(state.get(11), Double.class);

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
        verticalRate);
  }

  private <T> T decodeValue(Object value, Class<T> type) {
    if (value == null) {
      return null;
    }

    try {
      if (type == Long.class && value instanceof Number number) {
        return type.cast(number.longValue());
      }

      if (type == Double.class && value instanceof Number number) {
        return type.cast(number.doubleValue());
      }

      return type.cast(value);
    } catch (ClassCastException e) {
      throw new FlightDataProviderException("Invalid OpenSky state vector");
    }
  }
}
