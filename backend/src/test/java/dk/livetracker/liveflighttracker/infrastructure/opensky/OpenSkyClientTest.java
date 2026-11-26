package dk.livetracker.liveflighttracker.infrastructure.opensky;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStatesResponse;
import java.time.Clock;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@ExtendWith(MockitoExtension.class)
class OpenSkyClientTest {

  private static final String TOKEN_URL =
      "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

  private static final String STATES_URL = "https://opensky-network.org/api/states/all";

  private MockRestServiceServer mockServer;
  private OpenSkyClient client;
  @Mock private Clock clock;

  @BeforeEach
  void setUp() {
    RestClient.Builder restClientBuilder = RestClient.builder();

    mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

    OpenSkyProperties properties = new OpenSkyProperties("test-client", "test-secret");

    client = new OpenSkyClient(restClientBuilder, properties, clock);
  }

  private void expectTokenRequest() {
    mockServer
        .expect(requestTo(TOKEN_URL))
        .andRespond(
            withSuccess(
                """
                {
                    "access_token": "test-token",
                    "expires_in": 1800,
                    "token_type": "Bearer"
                }
                """,
                MediaType.APPLICATION_JSON));
  }

  private void expectStatesRequest() {
    mockServer
        .expect(requestTo(STATES_URL))
        .andExpect(method(HttpMethod.GET))
        .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-token"))
        .andRespond(
            withSuccess(
                """
                {
                    "time": 1790000000,
                    "states": []
                }
                """,
                MediaType.APPLICATION_JSON));
  }

  @Test
  void getCurrentStatesShouldThrowFlightDataProviderExceptionWhenServerReturns500() {
    // given
    expectTokenRequest();
    when(clock.instant()).thenReturn(Instant.now());
    mockServer
        .expect(requestTo(STATES_URL))
        .andExpect(method(HttpMethod.GET))
        .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-token"))
        .andRespond(withServerError());

    // when and then
    FlightDataProviderException exception =
        assertThrows(FlightDataProviderException.class, client::getCurrentStates);

    assertInstanceOf(RestClientException.class, exception.getCause());

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldThrowFlightDataProviderExceptionWhenTokenResponseIsInvalid() {
    // given
    mockServer
        .expect(requestTo(TOKEN_URL))
        .andExpect(method(HttpMethod.POST))
        .andRespond(
            withSuccess(
                """
                {
                    "expires_in": 1800,
                    "token_type": "Bearer"
                }
                """,
                MediaType.APPLICATION_JSON));
    // when & then
    assertThrows(FlightDataProviderException.class, client::getCurrentStates);

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldThrowFlightDataProviderExceptionWhenResponseIsEmpty() {
    // given
    expectTokenRequest();
    when(clock.instant()).thenReturn(Instant.now());
    mockServer
        .expect(requestTo(STATES_URL))
        .andExpect(method(HttpMethod.GET))
        .andRespond(withSuccess("", MediaType.APPLICATION_JSON));
    // when and then
    assertThrows(FlightDataProviderException.class, client::getCurrentStates);

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldReturnResponseWhenApiCallSucceeds() {
    // given
    expectTokenRequest();
    expectStatesRequest();
    // when
    when(clock.instant()).thenReturn(Instant.now());
    OpenSkyStatesResponse response = client.getCurrentStates();
    // then
    assertNotNull(response);
    assertEquals(1790000000L, response.time());
    assertNotNull(response.states());
    assertTrue(response.states().isEmpty());

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldReuseAccessToken() {
    // given
    expectTokenRequest();
    expectStatesRequest();
    expectStatesRequest();

    // when
    when(clock.instant()).thenReturn(Instant.now());
    client.getCurrentStates();
    client.getCurrentStates();
    // then
    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldFetchNewTokenWhenTokenIsAboutToExpire() {
    // Given
    Instant start = Instant.parse("2026-11-26T10:00:00Z");
    Instant nearExpiry = start.plusSeconds(1741);

    when(clock.instant()).thenReturn(start, nearExpiry, nearExpiry);

    expectTokenRequest();
    expectStatesRequest();
    expectTokenRequest();
    expectStatesRequest();

    // When
    client.getCurrentStates();
    client.getCurrentStates();

    // Then
    verify(clock, times(3)).instant();
    mockServer.verify();
  }
}
