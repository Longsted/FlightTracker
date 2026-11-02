package dk.livetracker.liveflighttracker.application.service;
import dk.livetracker.liveflighttracker.application.interfaces.FlightDataProvider;
import dk.livetracker.liveflighttracker.domain.Flight;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.BeforeEach;


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
        List<Flight> expectedFlights = List.of(/* testdata */);
        when(provider.getCurrentFlights()).thenReturn(expectedFlights);

        // When
        List<Flight> actualFlights = service.getCurrentFlights();

        // Then
        assertEquals(expectedFlights, actualFlights);
        verify(provider).getCurrentFlights();
    }

    @Test
    void getFlightsInAreaPassesCoordinatesToProvider() {
        // Given
        double minLongitude = 8.0;
        double minLatitude = 54.0;
        double maxLongitude = 13.0;
        double maxLatitude = 58.0;

        when(provider.getFlightsInArea(
                minLongitude, minLatitude, maxLongitude, maxLatitude
        )).thenReturn(List.of());

        // When
        service.getFlightsInArea(
                minLongitude, minLatitude, maxLongitude, maxLatitude
        );

        // Then
        verify(provider).getFlightsInArea(
                minLongitude, minLatitude, maxLongitude, maxLatitude
        );
    }
}

