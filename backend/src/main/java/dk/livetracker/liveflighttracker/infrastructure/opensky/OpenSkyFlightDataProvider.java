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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!e2e")
public class OpenSkyFlightDataProvider implements FlightDataProvider {

  private static final Logger log = LoggerFactory.getLogger(OpenSkyFlightDataProvider.class);
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
      throw new FlightDataProviderException("Opensky response contained no state data.");
    }
    List<Flight> flights = new ArrayList<>();
    int invalidFlightCount = 0;
    for (List<Object> state : states) {
      OpenSkyStateVector openSkyStateVector;
      try {
        openSkyStateVector = decoder.decode(state);
      } catch (FlightDataProviderException e) {
        invalidFlightCount++;
        continue;
      }
      Flight flight = mapper.toFlight(openSkyStateVector);

      flights.add(flight);

    }
    if(invalidFlightCount > 0){
      log.debug("Skipped {} malformed state vectors out of {} total states",
              invalidFlightCount,states.size());
    }
    return flights;
  }
}
