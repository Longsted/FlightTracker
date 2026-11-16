package dk.livetracker.liveflighttracker.application.dto;

public record FlightFilter(
    String originCountry,
    Double minAltitude,
    Double maxAltitude,
    Double minVelocity,
    Double maxVelocity,
    Boolean onGround,
    Double minLongitude,
    Double maxLongitude,
    Double minLatitude,
    Double maxLatitude) {}
