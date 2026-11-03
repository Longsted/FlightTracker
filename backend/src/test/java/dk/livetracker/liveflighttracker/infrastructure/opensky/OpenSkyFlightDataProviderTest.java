package dk.livetracker.liveflighttracker.infrastructure.opensky;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import dk.livetracker.liveflighttracker.domain.Flight;
import dk.livetracker.liveflighttracker.infrastructure.opensky.decoder.OpenSkyStateVectorDecoder;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStateVector;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStatesResponse;
import dk.livetracker.liveflighttracker.infrastructure.opensky.exception.OpenSkyApiException;
import dk.livetracker.liveflighttracker.infrastructure.opensky.mapper.OpenSkyStateVectorMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class OpenSkyFlightDataProviderTest {

  @Mock private OpenSkyClient openSkyClientMock;
  @Mock private OpenSkyStateVectorDecoder openSkyStateVectorDecoderMock;
  @Mock private OpenSkyStateVectorMapper openSkyStateVectorMapperMock;

  private OpenSkyFlightDataProvider provider;

  @BeforeEach
  void setup() {
    provider =
        new OpenSkyFlightDataProvider(
            openSkyClientMock, openSkyStateVectorDecoderMock, openSkyStateVectorMapperMock);
  }

  @Test
  void getCurrentFlights_skipsInvalidStateVectorAndReturnsValidFlights() {
    // given
    List<Object> stateA = List.of("flightA");
    List<Object> stateB = List.of("flightB");
    List<Object> stateC = List.of("flightC");

    OpenSkyStatesResponse response =
        new OpenSkyStatesResponse(123456L, List.of(stateA, stateB, stateC));

    OpenSkyStateVector vectorA =
        new OpenSkyStateVector(
            "icaoA", "CALLA", "Denmark", 123456L, 123456L, 10.0, 55.0, 10000.0, false, 200.0, 180.0,
            0.0);

    OpenSkyStateVector vectorC =
        new OpenSkyStateVector(
            "icaoC", "CALLC", "Germany", 123456L, 123456L, 11.0, 56.0, 11000.0, false, 210.0, 190.0,
            1.0);

    Flight flightA =
        new Flight(
            "icaoA",
            "CALLA",
            "Denmark",
            Instant.ofEpochSecond(123456L),
            Instant.ofEpochSecond(123456L),
            10.0,
            55.0,
            10000.0,
            false,
            200.0,
            180.0,
            0.0);

    Flight flightC =
        new Flight(
            "icaoC",
            "CALLC",
            "Germany",
            Instant.ofEpochSecond(123456L),
            Instant.ofEpochSecond(123456L),
            11.0,
            56.0,
            11000.0,
            false,
            210.0,
            190.0,
            1.0);

    when(openSkyClientMock.getCurrentStates()).thenReturn(response);

    when(openSkyStateVectorDecoderMock.decode(stateA)).thenReturn(vectorA);
    when(openSkyStateVectorDecoderMock.decode(stateB))
        .thenThrow(new OpenSkyApiException("Invalid state vector"));
    when(openSkyStateVectorDecoderMock.decode(stateC)).thenReturn(vectorC);

    when(openSkyStateVectorMapperMock.toFlight(vectorA)).thenReturn(flightA);
    when(openSkyStateVectorMapperMock.toFlight(vectorC)).thenReturn(flightC);

    // when
    List<Flight> result = provider.getCurrentFlights();

    // then
    assertEquals(List.of(flightA, flightC), result);

    verify(openSkyStateVectorMapperMock).toFlight(vectorA);
    verify(openSkyStateVectorMapperMock).toFlight(vectorC);
  }

  @Test
  void getCurrentFlights_returnsEmptyListWhenStatesIsNull() {
    // given
    OpenSkyStatesResponse response = new OpenSkyStatesResponse(123456L, null);
    when(openSkyClientMock.getCurrentStates()).thenReturn(response);

    // when
    List<Flight> result = provider.getCurrentFlights();

    // then
    assertEquals(List.of(), result);
  }

  @Test
  void getCurrentFlights_returnsEmptyListWhenStatesIsEmpty() {
    // given
    OpenSkyStatesResponse response = new OpenSkyStatesResponse(123456L, List.of());
    when(openSkyClientMock.getCurrentStates()).thenReturn(response);

    // when
    List<Flight> result = provider.getCurrentFlights();

    // then
    assertEquals(List.of(), result);
  }

  @Test
  void getCurrentFlights_returnsEmptyListWhenAllStateVectorsAreInvalid() {
    // given
    List<Object> stateA = List.of("flightA");
    List<Object> stateB = List.of("flightB");

    OpenSkyStatesResponse response = new OpenSkyStatesResponse(123456L, List.of(stateA, stateB));

    when(openSkyClientMock.getCurrentStates()).thenReturn(response);

    when(openSkyStateVectorDecoderMock.decode(stateA))
        .thenThrow(new OpenSkyApiException("Invalid state vector"));
    when(openSkyStateVectorDecoderMock.decode(stateB))
        .thenThrow(new OpenSkyApiException("Invalid state vector"));

    // when
    List<Flight> result = provider.getCurrentFlights();

    // then
    assertEquals(List.of(), result);
  }

  @Test
  void getCurrentFlights_skipsNullStateVector() {
    // given
    List<Object> validState = List.of("flightA");

    List<List<Object>> states = new ArrayList<>();
    states.add(null);
    states.add(validState);

    OpenSkyStatesResponse response = new OpenSkyStatesResponse(123456L, states);

    OpenSkyStateVector vector =
        new OpenSkyStateVector(
            "icaoA", "CALLA", "Denmark", 123456L, 123456L, 10.0, 55.0, 10000.0, false, 200.0, 180.0,
            0.0);

    Flight flight =
        new Flight(
            "icaoA",
            "CALLA",
            "Denmark",
            Instant.ofEpochSecond(123456L),
            Instant.ofEpochSecond(123456L),
            10.0,
            55.0,
            10000.0,
            false,
            200.0,
            180.0,
            0.0);

    when(openSkyClientMock.getCurrentStates()).thenReturn(response);
    when(openSkyStateVectorDecoderMock.decode(null))
        .thenThrow(new OpenSkyApiException("Invalid state vector"));
    when(openSkyStateVectorDecoderMock.decode(validState)).thenReturn(vector);
    when(openSkyStateVectorMapperMock.toFlight(vector)).thenReturn(flight);

    // when
    List<Flight> result = provider.getCurrentFlights();

    // then
    assertEquals(List.of(flight), result);
  }
}
