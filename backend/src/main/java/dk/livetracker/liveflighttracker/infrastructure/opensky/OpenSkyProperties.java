package dk.livetracker.liveflighttracker.infrastructure.opensky;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "opensky")
public record OpenSkyProperties(
        String clientId,
        String clientSecret
) {
}