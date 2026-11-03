package dk.livetracker.liveflighttracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class LiveFlightTrackerApplication {

  public static void main(String[] args) {
    SpringApplication.run(LiveFlightTrackerApplication.class, args);
  }
}
