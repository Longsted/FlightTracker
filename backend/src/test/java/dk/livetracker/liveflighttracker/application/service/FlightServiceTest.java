package dk.livetracker.liveflighttracker.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FlightServiceTest {

  private FlightDataProvider provider;
  private FlightService service;

  @BeforeEach
  void setUp() {
    provider = mock(FlightDataProvider.class);
    service = new FlightService(provider);
  }

  @Test
  void getCurrentFlightsReturnsFlightsFromProvider() {
    // Given
    List<Flight> expectedFlights = List.of(/* testdata */ );
    when(provider.getCurrentFlights()).thenReturn(expectedFlights);

    // When
    List<Flight> actualFlights = service.getCurrentFlights();

    // Then
    assertEquals(expectedFlights, actualFlights);
    verify(provider).getCurrentFlights();
  }
}
