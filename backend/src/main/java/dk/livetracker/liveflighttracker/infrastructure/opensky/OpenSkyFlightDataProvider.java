package dk.livetracker.liveflighttracker.infrastructure.opensky;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.domain.Flight;
import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import dk.livetracker.liveflighttracker.infrastructure.opensky.decoder.OpenSkyStateVectorDecoder;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStateVector;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStatesResponse;
import dk.livetracker.liveflighttracker.infrastructure.opensky.mapper.OpenSkyStateVectorMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OpenSkyFlightDataProvider implements FlightDataProvider {

  private final OpenSkyClient openSkyClient;
  private final OpenSkyStateVectorDecoder decoder;
  private final OpenSkyStateVectorMapper mapper;

  public OpenSkyFlightDataProvider(
      OpenSkyClient openSkyClient,
      OpenSkyStateVectorDecoder decoder,
      OpenSkyStateVectorMapper mapper) {

    this.openSkyClient = openSkyClient;
    this.decoder = decoder;
    this.mapper = mapper;
  }

  @Override
  public List<Flight> getCurrentFlights() {
    OpenSkyStatesResponse response = openSkyClient.getCurrentStates();

    List<List<Object>> states = response.states();

    if (states == null) {
      return List.of();
    }
    List<Flight> flights = new ArrayList<>();
    for (List<Object> state : states) {
      OpenSkyStateVector openSkyStateVector;
      try {
        openSkyStateVector = decoder.decode(state);
      } catch (FlightDataProviderException e) {
        continue;
      }
      Flight flight = mapper.toFlight(openSkyStateVector);

      flights.add(flight);
    }
    return flights;
  }
}
