package dk.livetracker.liveflighttracker.infrastructure.opensky.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record OpenSkyStatesResponse(
        long time,

        @JsonProperty("states")
        List<List<Object>> states
) {
}