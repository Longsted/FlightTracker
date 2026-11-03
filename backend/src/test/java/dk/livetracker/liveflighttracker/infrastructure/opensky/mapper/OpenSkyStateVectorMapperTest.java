package dk.livetracker.liveflighttracker.infrastructure.opensky.mapper;

import dk.livetracker.liveflighttracker.domain.Flight;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStateVector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class OpenSkyStateVectorMapperTest {

    private OpenSkyStateVectorMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new OpenSkyStateVectorMapper();
    }

    @Test
    void shouldMapAllFieldsCorrectly() {
        OpenSkyStateVector stateVector = new OpenSkyStateVector(
                "abc123",
                "SAS123",
                "Denmark",
                1790000000L,
                1790000010L,
                10.5,
                55.7,
                10500.0,
                true,
                250.0,
                180.0,
                2.5
        );

        Flight flight = mapper.toFlight(stateVector);

        assertAll(
                () -> assertEquals("abc123", flight.icao24()),
                () -> assertEquals("SAS123", flight.callsign()),
                () -> assertEquals("Denmark", flight.originCountry()),
                () -> assertEquals(
                        Instant.ofEpochSecond(1790000000L),
                        flight.timePosition()
                ),
                () -> assertEquals(
                        Instant.ofEpochSecond(1790000010L),
                        flight.lastContact()
                ),
                () -> assertEquals(10.5, flight.longitude()),
                () -> assertEquals(55.7, flight.latitude()),
                () -> assertEquals(10500.0, flight.barometricAltitude()),
                () -> assertTrue(flight.onGround()),
                () -> assertEquals(250.0, flight.velocity()),
                () -> assertEquals(180.0, flight.heading()),
                () -> assertEquals(2.5, flight.verticalRate())
        );
    }

    @Test
    void shouldPreserveNullValues() {
        OpenSkyStateVector stateVector = new OpenSkyStateVector(
                "abc123",
                null,
                "Denmark",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        Flight flight = mapper.toFlight(stateVector);

        assertAll(
                () -> assertNull(flight.callsign()),
                () -> assertNull(flight.timePosition()),
                () -> assertNull(flight.lastContact()),
                () -> assertNull(flight.longitude()),
                () -> assertNull(flight.latitude()),
                () -> assertNull(flight.barometricAltitude()),
                () -> assertNull(flight.velocity()),
                () -> assertNull(flight.heading()),
                () -> assertNull(flight.verticalRate())
        );
    }

    @Test
    void shouldMapOnGroundFalse() {
        OpenSkyStateVector stateVector = new OpenSkyStateVector(
                "abc123",
                null,
                "Denmark",
                null,
                null,
                null,
                null,
                null,
                false,
                null,
                null,
                null
        );

        Flight flight = mapper.toFlight(stateVector);

        assertFalse(flight.onGround());
    }
    @Test
    void shouldThrowExceptionWhenStateVectorIsNull() {
        NullPointerException exception = assertThrows(
                NullPointerException.class,
                () -> mapper.toFlight(null)
        );

        assertEquals("stateVector must not be null", exception.getMessage());
    }
}