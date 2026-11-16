package dk.livetracker.liveflighttracker.infrastructure.testing;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("e2e")
@ComponentScan(basePackageClasses = SimulatedFlightDataProvider.class)
public class E2ETestConfiguration {}
