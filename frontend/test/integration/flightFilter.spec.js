import { test, expect } from "./fixtures/testFixtures.js";
import {
  createFlight,
  mockFlightApi,
  mockSearchAndFilterApi,
} from "./helpers/integrationTestHelpers.js";

// ========================================
// Flight filters
// ========================================

test("filters flights by origin country", async ({ page }) => {
  // Given: Flights from different countries are available.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "SAS123",
      originCountry: "Denmark",
    }),
    createFlight({
      icao24: "def456",
      callsign: "DLH456",
      originCountry: "Germany",
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[0]],
  });

  await page.goto("/");

  // When: The user filters by Denmark.
  await page.getByLabel("Origin country").selectOption("Denmark");

  // Then: The filter endpoint receives the selected country.
  await expect.poll(() => apiMock.filterRequestCount()).toBe(1);
  expect(apiMock.filterRequests[0]).toMatchObject({
    originCountry: "Denmark",
  });

  // Then: Only flights originating from Denmark are displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("SAS123");
});

test("filters flights within an altitude range", async ({ page }) => {
  // Given: Flights with different altitudes are available.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "LOW123",
      barometricAltitude: 1000,
    }),
    createFlight({
      icao24: "def456",
      callsign: "MID456",
      barometricAltitude: 5000,
    }),
    createFlight({
      icao24: "ghi789",
      callsign: "HIGH789",
      barometricAltitude: 10000,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[1]],
  });

  await page.goto("/");

  // When: The user selects an altitude range of 4,000–6,000 metres.
  const altitudeInputs = page.locator(".flight-filters input[type='number']");

  await altitudeInputs.nth(0).fill("4000");
  await altitudeInputs.nth(1).fill("6000");

  // Then: The filter endpoint receives the selected range.
  await expect.poll(() => apiMock.filterRequestCount()).toBeGreaterThan(0);
  expect(apiMock.filterRequests.at(-1)).toMatchObject({
    minAltitude: "4000",
    maxAltitude: "6000",
  });

  // Then: Only flights within the selected range are displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("MID456");
});

test("filters flights by velocity", async ({ page }) => {
  // Given: Flights with different velocities are available.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "SLOW123",
      velocity: 150,
    }),
    createFlight({
      icao24: "def456",
      callsign: "FAST456",
      velocity: 250,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[1]],
  });

  await page.goto("/");

  // When: The user sets a minimum velocity of 200 m/s.
  const velocityInputs = page.locator(".flight-filters input[type='number']");

  await velocityInputs.nth(2).fill("200");

  // Then: The filter endpoint receives the minimum velocity.
  await expect.poll(() => apiMock.filterRequestCount()).toBeGreaterThan(0);
  expect(apiMock.filterRequests.at(-1)).toMatchObject({
    minVelocity: "200",
  });

  // Then: Only flights meeting the minimum velocity are displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("FAST456");
});

test("filters flights by airborne and on-ground status", async ({ page }) => {
  // Given: Both airborne and on-ground flights are available.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "AIR123",
      onGround: false,
    }),
    createFlight({
      icao24: "def456",
      callsign: "GROUND456",
      onGround: true,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[1]],
  });

  await page.goto("/");

  // When: The user selects on-ground flights.
  await page.getByLabel("Flight status").selectOption("true");

  // Then: The filter endpoint receives the correct status.
  await expect.poll(() => apiMock.filterRequestCount()).toBe(1);
  expect(apiMock.filterRequests[0]).toMatchObject({
    onGround: "true",
  });

  // Then: Only on-ground flights are displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("GROUND456");
});

test("combines multiple active filters", async ({ page }) => {
  // Given: Flights with different countries, altitudes and statuses.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "MATCH123",
      originCountry: "Denmark",
      barometricAltitude: 8000,
      onGround: false,
    }),
    createFlight({
      icao24: "def456",
      callsign: "WRONG-COUNTRY",
      originCountry: "Germany",
      barometricAltitude: 8000,
      onGround: false,
    }),
    createFlight({
      icao24: "ghi789",
      callsign: "WRONG-STATUS",
      originCountry: "Denmark",
      barometricAltitude: 8000,
      onGround: true,
    }),
    createFlight({
      icao24: "jkl012",
      callsign: "WRONG-ALTITUDE",
      originCountry: "Denmark",
      barometricAltitude: 2000,
      onGround: false,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[0]],
  });

  await page.goto("/");

  // When: The user applies country, altitude and flight-status filters.
  await page.getByLabel("Origin country").selectOption("Denmark");

  const altitudeInputs = page.locator(".flight-filters input[type='number']");

  await altitudeInputs.nth(0).fill("5000");
  await page.getByLabel("Flight status").selectOption("false");

  // Then: The filter endpoint receives all active criteria.
  await expect
    .poll(() =>
      apiMock.filterRequests.some(
        (request) =>
          request.originCountry === "Denmark" &&
          request.minAltitude === "5000" &&
          request.onGround === "false",
      ),
    )
    .toBe(true);

  // Then: Only flights matching all active filters are displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("MATCH123");
});

test("clears active filters and restores all flights", async ({ page }) => {
  // Given: Multiple flights are available and filters are active.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "SAS123",
      originCountry: "Denmark",
      onGround: false,
    }),
    createFlight({
      icao24: "def456",
      callsign: "DLH456",
      originCountry: "Germany",
      onGround: true,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[0]],
  });

  await page.goto("/");

  await page.getByLabel("Origin country").selectOption("Denmark");
  await page.getByLabel("Flight status").selectOption("false");

  await expect.poll(() => apiMock.filterRequestCount()).toBeGreaterThan(0);

  // When: The user clears all filters.
  await page.getByRole("button", { name: "Clear filters" }).click();

  // Then: All filter controls are reset.
  await expect(page.getByLabel("Origin country")).toHaveValue("");
  await expect(page.getByLabel("Flight status")).toHaveValue("");

  // Then: All flights are displayed again.
  await expect(page.locator(".flight-list-item")).toHaveCount(2);
});

test("handles flights with missing altitude when filtering", async ({
  page,
}) => {
  // Given: Flights are available, including one without altitude data.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "KNOWN123",
      barometricAltitude: 8000,
    }),
    createFlight({
      icao24: "def456",
      callsign: "UNKNOWN456",
      barometricAltitude: null,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[0]],
  });

  await page.goto("/");

  // When: The user applies a minimum altitude filter.
  const altitudeInputs = page.locator(".flight-filters input[type='number']");

  await altitudeInputs.nth(0).fill("5000");

  // Then: The filter endpoint receives the minimum altitude.
  await expect.poll(() => apiMock.filterRequestCount()).toBeGreaterThan(0);
  expect(apiMock.filterRequests.at(-1)).toMatchObject({
    minAltitude: "5000",
  });

  // Then: The flight with known altitude is displayed.
  // The flight with missing altitude does not match the active filter.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("KNOWN123");
});

test("applies filters to both the flight list and map markers", async ({
  page,
}) => {
  // Given: Flights from different countries are available.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "SAS123",
      originCountry: "Denmark",
    }),
    createFlight({
      icao24: "def456",
      callsign: "DLH456",
      originCountry: "Germany",
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[0]],
  });

  await page.goto("/");

  // When: The user filters by Denmark.
  await page.getByLabel("Origin country").selectOption("Denmark");

  // Then: The filter request is completed.
  await expect.poll(() => apiMock.filterRequestCount()).toBe(1);

  // Then: Only the matching flight is displayed in the list.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("SAS123");

  // Then: Only the matching marker is visible on the map.
  const markerOpacities = await page.evaluate(() => {
    const source = window.__OL_MAP__.getLayers().item(1).getSource();

    return Object.fromEntries(
      source
        .getFeatures()
        .map((feature) => [
          feature.getId(),
          feature.getStyle().getImage().getOpacity(),
        ]),
    );
  });

  expect(markerOpacities["abc123"]).toBe(1);
  expect(markerOpacities["def456"]).toBe(0);
});

test("handles flights with missing velocity when filtering", async ({
  page,
}) => {
  // Given: Flights are available, including one without velocity data.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "FAST123",
      velocity: 250,
    }),
    createFlight({
      icao24: "def456",
      callsign: "UNKNOWN456",
      velocity: null,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[0]],
  });

  await page.goto("/");

  // When: The user applies a minimum velocity filter.
  const velocityInputs = page.locator(".flight-filters input[type='number']");

  await velocityInputs.nth(2).fill("200");

  // Then: The filter endpoint receives the minimum velocity.
  await expect.poll(() => apiMock.filterRequestCount()).toBeGreaterThan(0);

  expect(apiMock.filterRequests.at(-1)).toMatchObject({
    minVelocity: "200",
  });

  // Then: The flight with known velocity is displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("FAST123");
});

test("handles flights with missing origin country when filtering", async ({
  page,
}) => {
  // Given: Flights are available, including one without origin country.
  const flights = [
    createFlight({
      icao24: "abc123",
      callsign: "SAS123",
      originCountry: "Denmark",
    }),
    createFlight({
      icao24: "def456",
      callsign: "UNKNOWN456",
      originCountry: null,
    }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    filteredFlights: [flights[0]],
  });

  await page.goto("/");

  // When: The user filters by Denmark.
  await page.getByLabel("Origin country").selectOption("Denmark");

  // Then: The filter endpoint receives the selected country.
  await expect.poll(() => apiMock.filterRequestCount()).toBe(1);

  expect(apiMock.filterRequests[0]).toMatchObject({
    originCountry: "Denmark",
  });

  // Then: Only the matching flight is displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("SAS123");
});
