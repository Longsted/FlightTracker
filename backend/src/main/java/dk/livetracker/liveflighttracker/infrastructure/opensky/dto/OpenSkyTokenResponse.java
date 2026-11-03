package dk.livetracker.liveflighttracker.infrastructure.opensky.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OpenSkyTokenResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("expires_in") long expiresIn,
    @JsonProperty("token_type") String tokenType) {}
