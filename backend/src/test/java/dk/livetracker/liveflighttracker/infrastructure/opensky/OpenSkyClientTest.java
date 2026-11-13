package dk.livetracker.liveflighttracker.infrastructure.opensky;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStatesResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

class OpenSkyClientTest {

  private static final String TOKEN_URL =
      "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

  private static final String STATES_URL = "https://opensky-network.org/api/states/all";

  private MockRestServiceServer mockServer;
  private OpenSkyClient client;

  @BeforeEach
  void setUp() {
    RestClient.Builder restClientBuilder = RestClient.builder();

    mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

    OpenSkyProperties properties = new OpenSkyProperties("test-client", "test-secret");

    client = new OpenSkyClient(restClientBuilder, properties);
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
  void getCurrentStatesShouldThrowOpenSkyApiExceptionWhenServerReturns500() {
    expectTokenRequest();

    mockServer
        .expect(requestTo(STATES_URL))
        .andExpect(method(HttpMethod.GET))
        .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer test-token"))
        .andRespond(withServerError());

    FlightDataProviderException exception =
        assertThrows(FlightDataProviderException.class, client::getCurrentStates);

    assertInstanceOf(RestClientException.class, exception.getCause());

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldThrowOpenSkyApiExceptionWhenTokenResponseIsInvalid() {
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

    assertThrows(FlightDataProviderException.class, client::getCurrentStates);

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldThrowOpenSkyApiExceptionWhenResponseIsEmpty() {
    expectTokenRequest();

    mockServer
        .expect(requestTo(STATES_URL))
        .andExpect(method(HttpMethod.GET))
        .andRespond(withSuccess("", MediaType.APPLICATION_JSON));

    assertThrows(FlightDataProviderException.class, client::getCurrentStates);

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldReturnResponseWhenApiCallSucceeds() {
    expectTokenRequest();
    expectStatesRequest();

    OpenSkyStatesResponse response = client.getCurrentStates();

    assertNotNull(response);
    assertEquals(1790000000L, response.time());
    assertNotNull(response.states());
    assertTrue(response.states().isEmpty());

    mockServer.verify();
  }

  @Test
  void getCurrentStatesShouldReuseAccessToken() {
    expectTokenRequest();
    expectStatesRequest();
    expectStatesRequest();

    client.getCurrentStates();
    client.getCurrentStates();

    mockServer.verify();
  }
}
