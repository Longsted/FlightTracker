package dk.livetracker.liveflighttracker.presentation.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightSnapshotStore;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class FlightControllerIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private FlightSnapshotStore snapshotStore;

  @MockitoBean private FlightDataProvider flightDataProvider;

  @Test
  void getFlightsReturnsFlightsFromSnapshot() throws Exception {
    // Given
    Flight validFlight = createFlight();
    Flight invalidFlight = createFlightWithPosition(181.0, 56.2639);

    when(snapshotStore.getSnapshot()).thenReturn(List.of(validFlight, invalidFlight));

    // When & Then
    mockMvc
        .perform(get("/api/flights"))
        .andExpect(status().isOk())
        .andExpect(
            content()
                .json(
                    """
                    [{
                        "icao24": "abc123",
                        "callsign": "SAS123",
                        "originCountry": "Denmark"
                    }]
                    """));
  }

  @Test
  void getFlightsReturnsEmptyListWhenSnapshotIsEmpty() throws Exception {
    // Given
    when(snapshotStore.getSnapshot()).thenReturn(List.of());

    // When & Then
    mockMvc.perform(get("/api/flights")).andExpect(status().isOk()).andExpect(content().json("[]"));
  }

  @Test
  void searchFlightsReturnsMatchingFlightsFromSnapshot() throws Exception {
    // Given
    Flight flight = createFlight();

    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When & Then
    mockMvc
        .perform(get("/api/flights/search").param("query", "SAS"))
        .andExpect(status().isOk())
        .andExpect(
            content()
                .json(
                    """
                    [{
                        "icao24": "abc123",
                        "callsign": "SAS123",
                        "originCountry": "Denmark"
                    }]
                    """));
  }

  @Test
  void searchFlightsReturnsEmptyListWhenNoMatches() throws Exception {
    // Given
    Flight flight = createFlight();

    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight));

    // When & Then
    mockMvc
        .perform(get("/api/flights/search").param("query", "NOTFOUND"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
  }

  @Test
  void filterFlightsFiltersByMultipleCriteria() throws Exception {
    // Given
    Flight matchingFlight = createFlight();
    Flight wrongCountry = createFlightWithCountry("Sweden");
    Flight wrongAltitude = createFlightWithAltitude(20000.0);

    when(snapshotStore.getSnapshot())
        .thenReturn(List.of(matchingFlight, wrongCountry, wrongAltitude));

    // When & Then
    mockMvc
        .perform(
            get("/api/flights/filter")
                .param("originCountry", "Denmark")
                .param("minAltitude", "5000")
                .param("maxAltitude", "12000")
                .param("onGround", "false"))
        .andExpect(status().isOk())
        .andExpect(
            content()
                .json(
                    """
                    [{
                        "icao24": "abc123",
                        "callsign": "SAS123",
                        "originCountry": "Denmark"
                    }]
                    """));
  }

  @Test
  void filterFlightsReturnsBadRequestForInvalidNumericParameter() throws Exception {
    // Given
    String invalidAltitude = "not-a-number";

    // When & Then
    mockMvc
        .perform(get("/api/flights/filter").param("minAltitude", invalidAltitude))
        .andExpect(status().isBadRequest());
  }

  private Flight createFlight() {
    return createFlightWithPosition(10.7522, 56.2639);
  }

  private Flight createFlightWithPosition(Double longitude, Double latitude) {
    return new Flight(
        "abc123",
        "SAS123",
        "Denmark",
        Instant.ofEpochSecond(1730000000L),
        Instant.ofEpochSecond(1730000000L),
        longitude,
        latitude,
        10000.0,
        false,
        250.0,
        180.0,
        0.0);
  }

  private Flight createFlightWithCountry(String country) {
    return new Flight(
        "def456",
        "SAS456",
        country,
        Instant.ofEpochSecond(1730000000L),
        Instant.ofEpochSecond(1730000000L),
        10.7522,
        56.2639,
        10000.0,
        false,
        250.0,
        180.0,
        0.0);
  }

  private Flight createFlightWithAltitude(Double altitude) {
    return new Flight(
        "ghi789",
        "SAS789",
        "Denmark",
        Instant.ofEpochSecond(1730000000L),
        Instant.ofEpochSecond(1730000000L),
        10.7522,
        56.2639,
        altitude,
        false,
        250.0,
        180.0,
        0.0);
  }
}
