package dk.livetracker.liveflighttracker.integration;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dk.livetracker.liveflighttracker.application.dto.FlightDataStatus;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import testutil.FlightTestDataFactory;

@SpringBootTest
@AutoConfigureMockMvc
class FlightControllerIntegrationTest {

  private static final String BASE_URI = "/api/flights";
  private static final String SEARCH_ENDPOINT = BASE_URI + "/search";
  private static final String FILTER_ENDPOINT = BASE_URI + "/filter";
  private static final String STATUS_ENDPOINT = BASE_URI + "/status";
  @Autowired private MockMvc mockMvc;

  @MockitoBean private FlightDataStore snapshotStore;

  @MockitoBean private FlightDataProvider flightDataProvider;

  @Test
  void getFlightsReturnsFlightsFromSnapshot() throws Exception {
    // Given
    Flight validFlight = FlightTestDataFactory.createSingleFlight();
    Flight invalidFlight = FlightTestDataFactory.createFlight(181.0, 56.2639);

    when(snapshotStore.getSnapshot()).thenReturn(List.of(validFlight, invalidFlight));

    // When
    mockMvc
        .perform(get(BASE_URI))
        // Then
        .andExpect(status().isOk())
        .andExpect(content().json(SINGLE_FLIGHT_JSON));
  }

  @Test
  void getFlightsReturnsEmptyListWhenSnapshotIsEmpty() throws Exception {
    // Given
    when(snapshotStore.getSnapshot()).thenReturn(List.of());

    // When
    mockMvc
        .perform(get(BASE_URI))
        // then
        .andExpect(status().isOk())
        .andExpect(content().json(EMPTY_FLIGHTS_JSON));
  }

  @Test
  void searchFlightsReturnsMatchingFlightsFromSnapshot() throws Exception {
    // Given
    Flight flight = FlightTestDataFactory.createFlight();

    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When
    mockMvc
        .perform(get(SEARCH_ENDPOINT).param("query", "SAS"))
        // Then
        .andExpect(status().isOk())
        .andExpect(content().json(SINGLE_FLIGHT_JSON));
  }

  @Test
  void searchFlightsReturnsEmptyListWhenNoMatches() throws Exception {
    // Given
    Flight flight = FlightTestDataFactory.createFlight();

    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When
    mockMvc
        .perform(get(SEARCH_ENDPOINT).param("query", "NOTFOUND"))
        // Then
        .andExpect(status().isOk())
        .andExpect(content().json(EMPTY_FLIGHTS_JSON));
  }

  @Test
  void filterFlightsFiltersByMultipleCriteria() throws Exception {
    // Given
    Flight matchingFlight =
        FlightTestDataFactory.createFlight("Denmark", 10000.0, 250.0, false, 10.7522, 56.2639);

    Flight wrongCountry =
        FlightTestDataFactory.createFlight("Sweden", 10000.0, 250.0, false, 10.7522, 56.2639);

    Flight wrongAltitude =
        FlightTestDataFactory.createFlight("Denmark", 20000.0, 250.0, false, 10.7522, 56.2639);

    when(snapshotStore.getSnapshot())
        .thenReturn(List.of(matchingFlight, wrongCountry, wrongAltitude));

    // When
    mockMvc
        .perform(
            get(FILTER_ENDPOINT)
                .param("originCountry", "Denmark")
                .param("minAltitude", "5000")
                .param("maxAltitude", "12000")
                .param("onGround", "false"))
        // Then
        .andExpect(status().isOk())
        .andExpect(content().json(SINGLE_FLIGHT_JSON));
  }

  @Test
  void filterFlightsReturnsBadRequestForInvalidNumericParameter() throws Exception {
    // Given
    String invalidAltitude = "not-a-number";

    // When
    mockMvc
        .perform(get(FILTER_ENDPOINT).param("minAltitude", invalidAltitude))

        // Then
        .andExpect(status().isBadRequest());
  }

  @Test
  void getFlightDataStatusReturnsCurrentStatus() throws Exception {
    // Given
    Instant timestamp = Instant.parse("2026-11-17T10:00:00Z");

    FlightDataStatus expectedStatus = new FlightDataStatus(true, timestamp, timestamp);

    when(snapshotStore.getStatus()).thenReturn(expectedStatus);

    // When
    mockMvc
        .perform(get(STATUS_ENDPOINT))
        // Then
        .andExpect(status().isOk())
        .andExpect(content().json(FLIGHT_STATUS_JSON));
  }

  private static final String SINGLE_FLIGHT_JSON =
      """
      [{
          "icao24": "abc123",
          "callsign": "SAS123",
          "originCountry": "Denmark"
      }]
      """;

  private static final String EMPTY_FLIGHTS_JSON = "[]";

  private static final String FLIGHT_STATUS_JSON =
      """
      {
          "available": true,
          "lastAttempt": "2026-11-17T10:00:00Z",
          "lastSuccessfulUpdate": "2026-11-17T10:00:00Z"
      }
      """;
}
