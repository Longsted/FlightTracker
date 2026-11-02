package dk.livetracker.liveflighttracker.infrastructure.opensky;

import dk.livetracker.liveflighttracker.infrastructure.opensky.exception.OpenSkyApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenSkyClientTest {

    private static final String TOKEN_URL =
            "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

    private static final String STATES_URL =
            "https://opensky-network.org/api/states/all";

    @Test
    void getCurrentStatesShouldThrowOpenSkyApiExceptionWhenServerReturns500() {
        RestClient.Builder restClientBuilder = RestClient.builder();

        MockRestServiceServer mockServer =
                MockRestServiceServer.bindTo(restClientBuilder).build();

        OpenSkyProperties properties =
                new OpenSkyProperties("test-client", "test-secret");

        OpenSkyClient client =
                new OpenSkyClient(restClientBuilder, properties);

        mockServer.expect(requestTo(TOKEN_URL))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(
                        """
                        {
                            "access_token": "test-token",
                            "expires_in": 1800,
                            "token_type": "Bearer"
                        }
                        """,
                        MediaType.APPLICATION_JSON
                ));

        mockServer.expect(requestTo(STATES_URL))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(
                        HttpHeaders.AUTHORIZATION,
                        "Bearer test-token"
                ))
                .andRespond(withServerError());

        OpenSkyApiException exception = assertThrows(
                OpenSkyApiException.class,
                client::getCurrentStates
        );

        assertInstanceOf(RestClientException.class, exception.getCause());

        mockServer.verify();
    }
}