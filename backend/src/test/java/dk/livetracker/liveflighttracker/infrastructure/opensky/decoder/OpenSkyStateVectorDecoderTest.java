package dk.livetracker.liveflighttracker.infrastructure.opensky.decoder;

import static org.junit.jupiter.api.Assertions.*;

import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStateVector;
import dk.livetracker.liveflighttracker.infrastructure.opensky.exception.OpenSkyApiException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OpenSkyStateVectorDecoderTest {

  private OpenSkyStateVectorDecoder decoder;

  @BeforeEach
  void setUp() {
    decoder = new OpenSkyStateVectorDecoder();
  }

  @Test
  void shouldDecodeAllFieldsCorrectly() {
    List<Object> state =
        List.of(
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
            2.5);

    OpenSkyStateVector result = decoder.decode(state);

    assertAll(
        () -> assertEquals("abc123", result.icao24()),
        () -> assertEquals("SAS123", result.callsign()),
        () -> assertEquals("Denmark", result.originCountry()),
        () -> assertEquals(1790000000L, result.timePosition()),
        () -> assertEquals(1790000010L, result.lastContact()),
        () -> assertEquals(10.5, result.longitude()),
        () -> assertEquals(55.7, result.latitude()),
        () -> assertEquals(10500.0, result.barometricAltitude()),
        () -> assertTrue(result.onGround()),
        () -> assertEquals(250.0, result.velocity()),
        () -> assertEquals(180.0, result.heading()),
        () -> assertEquals(2.5, result.verticalRate()));
  }

  @Test
  void shouldPreserveNullValuesForAllFields() {
    List<Object> state =
        java.util.Arrays.asList(
            null, null, null, null, null, null, null, null, null, null, null, null);

    OpenSkyStateVector result = decoder.decode(state);

    assertAll(
        () -> assertNull(result.icao24()),
        () -> assertNull(result.callsign()),
        () -> assertNull(result.originCountry()),
        () -> assertNull(result.timePosition()),
        () -> assertNull(result.lastContact()),
        () -> assertNull(result.longitude()),
        () -> assertNull(result.latitude()),
        () -> assertNull(result.barometricAltitude()),
        () -> assertNull(result.onGround()),
        () -> assertNull(result.velocity()),
        () -> assertNull(result.heading()),
        () -> assertNull(result.verticalRate()));
  }

  @Test
  void shouldDecodeIntegerValuesAsLongAndDouble() {
    List<Object> state =
        List.of(
            "abc123",
            "SAS123",
            "Denmark",
            1790000000,
            1790000010,
            10,
            55,
            10500,
            true,
            250,
            180,
            2);

    OpenSkyStateVector result = decoder.decode(state);

    assertAll(
        () -> assertEquals(1790000000L, result.timePosition()),
        () -> assertEquals(1790000010L, result.lastContact()),
        () -> assertEquals(10.0, result.longitude()),
        () -> assertEquals(55.0, result.latitude()),
        () -> assertEquals(10500.0, result.barometricAltitude()),
        () -> assertEquals(250.0, result.velocity()),
        () -> assertEquals(180.0, result.heading()),
        () -> assertEquals(2.0, result.verticalRate()));
  }

  @Test
  void shouldIgnoreAdditionalFields() {
    List<Object> state =
        java.util.Arrays.asList(
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
            2.5,
            null,
            1000.0,
            "1234",
            false,
            0 // Ekstra felter (OpenSky har 17)
            );

    OpenSkyStateVector result = decoder.decode(state);

    assertAll(
        () -> assertEquals("abc123", result.icao24()),
        () -> assertEquals(2.5, result.verticalRate()));
  }

  @Test
  void shouldThrowExceptionWhenStateIsNull() {
    assertThrows(OpenSkyApiException.class, () -> decoder.decode(null));
  }

  @Test
  void shouldThrowExceptionWhenStateHasTooFewElements() {
    List<Object> state =
        List.of(
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
            180.0);

    assertThrows(OpenSkyApiException.class, () -> decoder.decode(state));
  }

  @Test
  void shouldThrowExceptionWhenNumericFieldHasInvalidType() {
    List<Object> state =
        List.of(
            "abc123",
            "SAS123",
            "Denmark",
            1790000000L,
            1790000010L,
            "invalid",
            55.7,
            10500.0,
            true,
            250.0,
            180.0,
            0.0);

    assertThrows(OpenSkyApiException.class, () -> decoder.decode(state));
  }
}
