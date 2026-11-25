package dk.livetracker.liveflighttracker.infrastructure.opensky;

import dk.livetracker.liveflighttracker.infrastructure.exception.FlightDataProviderException;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyStatesResponse;
import dk.livetracker.liveflighttracker.infrastructure.opensky.dto.OpenSkyTokenResponse;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class OpenSkyClient {

  private static final Logger log = LoggerFactory.getLogger(OpenSkyClient.class);
  private final RestClient restClient;
  private final OpenSkyProperties properties;
  private static final String TOKEN_URL =
      "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

  private String accessToken;
  private Instant tokenExpiresAt;
  private static final long TOKEN_EXPIRY_BUFFER_SECONDS = 60;

  public OpenSkyClient(RestClient.Builder restClientBuilder, OpenSkyProperties properties) {
    this.restClient = restClientBuilder.build();
    this.properties = properties;
  }

  private OpenSkyTokenResponse fetchAccessToken() {
    log.debug("Requesting Oauth2 token from Opensky");
    MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
    formData.add("grant_type", "client_credentials");

    OpenSkyTokenResponse response;

    try {
      response =
          restClient
              .post()
              .uri(TOKEN_URL)
              .headers(
                  headers -> headers.setBasicAuth(properties.clientId(), properties.clientSecret()))
              .contentType(MediaType.APPLICATION_FORM_URLENCODED)
              .body(formData)
              .retrieve()
              .body(OpenSkyTokenResponse.class);

    } catch (RestClientException e) {
      throw new FlightDataProviderException("Failed to retrieve access token from OpenSky.", e);
    }

    if (response == null
        || response.accessToken() == null
        || response.accessToken().isBlank()
        || response.expiresIn() <= 0) {
      throw new FlightDataProviderException("OpenSky returned an invalid token response.");
    }
    log.info("succesfully retrieved Oauth2 token from Opensky");
    return response;
  }

  private String getAccessToken() {
    if (accessToken == null
        || tokenExpiresAt == null
        || Instant.now().plusSeconds(TOKEN_EXPIRY_BUFFER_SECONDS).isAfter(tokenExpiresAt)) {

      OpenSkyTokenResponse response = fetchAccessToken();

      accessToken = response.accessToken();
      tokenExpiresAt = Instant.now().plusSeconds(response.expiresIn());
    }

    return accessToken;
  }

  public OpenSkyStatesResponse getCurrentStates() {
    OpenSkyStatesResponse response;

    try {
      response =
          restClient
              .get()
              .uri("https://opensky-network.org/api/states/all")
              .headers(headers -> headers.setBearerAuth(getAccessToken()))
              .retrieve()
              .body(OpenSkyStatesResponse.class);

    } catch (RestClientException e) {
      throw new FlightDataProviderException("Failed to retrieve flight states from OpenSky.", e);
    }
    if (response == null) {
      throw new FlightDataProviderException("OpenSky returned an empty response.");
    }
    int sizeOfState = response.states() != null ? response.states().size() : 0;
    log.debug(
        "Retrieved {} aircraft states form Opensky (snapshot time: {}).",
        sizeOfState,
        response.time());
    return response;
  }
}
