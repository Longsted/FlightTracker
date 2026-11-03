package dk.livetracker.liveflighttracker.infrastructure.opensky.dto;

public record OpenSkyStateVector(
    String icao24,
    String callsign,
    String originCountry,
    Long timePosition,
    Long lastContact,
    Double longitude,
    Double latitude,
    Double barometricAltitude,
    Boolean onGround,
    Double velocity,
    Double heading,
    Double verticalRate) {}
