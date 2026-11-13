package dk.livetracker.liveflighttracker.presentation.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.application.interfaces.FlightSnapshotStore;
import dk.livetracker.liveflighttracker.application.service.FlightService;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FlightController.class)
@Import(FlightService.class)
class FlightControllerIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private FlightSnapshotStore snapshotStore;

  @MockitoBean private FlightDataProvider flightDataProvider;

  @Test
  void getFlightsReturnsEmptyList() throws Exception {
    // Given
    when(snapshotStore.getSnapshot()).thenReturn(List.of());

    // When & Then
    mockMvc.perform(get("/api/flights")).andExpect(status().isOk()).andExpect(content().json("[]"));
  }

  @Test
  void getFlightsReturnsFlights() throws Exception {
    // Given
    Flight flight = createFlight();

    when(snapshotStore.getSnapshot()).thenReturn(List.of(flight, flight));

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
                        "originCountry": "Denmark",
                        "longitude": 10.7522,
                        "latitude": 56.2639
                    },
                    {
                        "icao24": "abc123",
                        "callsign": "SAS123",
                        "originCountry": "Denmark",
                        "longitude": 10.7522,
                        "latitude": 56.2639
                    }]
                    """));
  }

  @Test
  void searchFlightsReturnsMatchingFlights() throws Exception {
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

  private Flight createFlight() {
    return new Flight(
        "abc123",
        "SAS123",
        "Denmark",
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
}
