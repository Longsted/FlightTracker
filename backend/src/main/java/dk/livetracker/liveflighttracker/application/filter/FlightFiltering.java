package dk.livetracker.liveflighttracker.application.filter;

import dk.livetracker.liveflighttracker.application.dto.FlightFilter;
import dk.livetracker.liveflighttracker.domain.Flight;
import java.util.List;
import java.util.function.Predicate;
import org.springframework.stereotype.Component;

@Component
public class FlightFiltering {

  public List<Flight> filter(List<Flight> flights, FlightFilter filter) {
    if (filter == null) {
      return List.of();
    }

    Predicate<Flight> predicate =
        matchesCountry(filter)
            .and(matchesAltitude(filter))
            .and(matchesVelocity(filter))
            .and(matchesFlightStatus(filter))
            .and(matchesGeographicalArea(filter));

    return flights.stream().filter(predicate).toList();
  }

  private Predicate<Flight> matchesCountry(FlightFilter filter) {
    return flight ->
        filter.originCountry() == null
            || filter.originCountry().isBlank()
            || (flight.originCountry() != null
                && filter.originCountry().equalsIgnoreCase(flight.originCountry()));
  }

  private Predicate<Flight> matchesAltitude(FlightFilter filter) {
    return flight ->
        isWithinRange(flight.barometricAltitude(), filter.minAltitude(), filter.maxAltitude());
  }

  private Predicate<Flight> matchesVelocity(FlightFilter filter) {
    return flight -> isWithinRange(flight.velocity(), filter.minVelocity(), filter.maxVelocity());
  }

  private Predicate<Flight> matchesFlightStatus(FlightFilter filter) {
    return flight -> filter.onGround() == null || flight.onGround() == filter.onGround();
  }

  private Predicate<Flight> matchesGeographicalArea(FlightFilter filter) {
    boolean hasBounds =
        filter.minLongitude() != null
            || filter.maxLongitude() != null
            || filter.minLatitude() != null
            || filter.maxLatitude() != null;

    return flight ->
        !hasBounds
            || (flight.hasValidPosition()
                && isWithinRange(flight.longitude(), filter.minLongitude(), filter.maxLongitude())
                && isWithinRange(flight.latitude(), filter.minLatitude(), filter.maxLatitude()));
  }

  private boolean isWithinRange(Double value, Double min, Double max) {
    if (min == null && max == null) {
      return true;
    }
    if (value == null) {
      return false;
    }
    boolean aboveMin = (min == null || value >= min);
    boolean belowMax = (max == null || value <= max);
    return aboveMin && belowMax;
  }
}
