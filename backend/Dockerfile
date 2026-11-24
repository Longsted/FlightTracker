# syntax=docker/dockerfile:1
#build jar with gradle

FROM eclipse-temurin:21-jdk-noble AS builder
WORKDIR /app


COPY gradlew \
     build.gradle \
     settings.gradle \
     ./
COPY gradle/ ./gradle/

RUN chmod +x gradlew



COPY src/ src/
# Build application with Gradle dependency caching
RUN --mount=type=cache,target=/root/.gradle/caches \
    --mount=type=cache,target=/root/.gradle/wrapper \
    ./gradlew bootJar --no-daemon

#run stage
FROM eclipse-temurin:21-jre-noble AS runtime

WORKDIR /app

# Create non-root user
RUN useradd --system --uid 1001 appuser

COPY --from=builder --chown=1001:1001 /app/build/libs/app.jar app.jar

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]