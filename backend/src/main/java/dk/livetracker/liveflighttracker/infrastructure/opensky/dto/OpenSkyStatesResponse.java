package dk.livetracker.liveflighttracker.infrastructure.opensky.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record OpenSkyStatesResponse(
        long time,
        @JsonProperty("states")
        List<List<Object>> states
) {
    public OpenSkyStatesResponse {
        if (states != null) {
            List<List<Object>> copiedStates = new ArrayList<>();

            for (List<Object> state : states) {
                if (state == null) {
                    copiedStates.add(null);
                } else {
                    copiedStates.add(
                            Collections.unmodifiableList(new ArrayList<>(state))
                    );
                }
            }

            states = Collections.unmodifiableList(copiedStates);
        }
    }

    @Override
    public List<List<Object>> states() {
        if (states == null) {
            return null;
        }

        List<List<Object>> copiedStates = new ArrayList<>();

        for (List<Object> state : states) {
            if (state == null) {
                copiedStates.add(null);
            } else {
                copiedStates.add(
                        Collections.unmodifiableList(new ArrayList<>(state))
                );
            }
        }

        return Collections.unmodifiableList(copiedStates);
    }
}