package dk.livetracker.liveflighttracker.presentation.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dk.livetracker.liveflighttracker.application.service.FlightService;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FlightController.class)
class FlightControllerIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private FlightService flightService;

  @Test
  void getFlightsReturnsEmptyList() throws Exception {
    when(flightService.getCurrentFlights()).thenReturn(List.of());

    mockMvc.perform(get("/api/flights")).andExpect(status().isOk()).andExpect(content().json("[]"));
  }

  @Test
  void getFlightsReturnsFlights() throws Exception {
    Flight flight =
        new Flight(
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

    when(flightService.getCurrentFlights()).thenReturn(List.of(flight, flight));

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
                        }
                        ]
                        """));
    verify(flightService, times(1)).getCurrentFlights();
  }
}
