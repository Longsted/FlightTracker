import { test, expect } from "./fixtures/testFixtures.js";
import {
  createFlight,
  mockFlightApi,
  clickFlightPosition,
  flightDetail,
  flightDetailsContent,
} from "./helpers/integrationTestHelpers.js";

// ========================================
// US1 - Display flight data on map
// ========================================

test("displays flight data received from API", async ({ page }) => {
  const flights = [
    createFlight(),
    createFlight({
      icao24: "def456",
      callsign: "TEST456",
      originCountry: "Germany",
      longitude: 13.405,
      latitude: 52.52,
      barometricAltitude: 11000,
      velocity: 230,
      heading: 90,
    }),
  ];

  await mockFlightApi(page, { flights });
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 2 flights");
  await expect(page.locator("#flight-map")).toBeVisible();
});

test("displays message when no flights are available", async ({ page }) => {
  await mockFlightApi(page);
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText(
    "No flights currently available",
  );

  await expect(page.locator("#flight-map")).toBeVisible();
});

test("displays error message when API returns HTTP 500", async ({ page }) => {
  await mockFlightApi(page, { status: 500 });
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText(
      "Flight data is currently unavailable",
  );

  await expect(page.locator("#flight-map")).toBeVisible();
});

test("displays flight marker at its geographic position", async ({ page }) => {
  const flight = createFlight({
    callsign: "TEST-CENTER",
    longitude: 10.5,
    latitude: 56.0,
  });

  await mockFlightApi(page, { flights: [flight] });
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");

  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeVisible();

  await expect(flightDetail(page, "callsign")).toHaveText("TEST-CENTER");
  await expect(flightDetail(page, "icao24")).toHaveText("abc123");
  await expect(flightDetail(page, "origin-country")).toHaveText("Denmark");
  await expect(flightDetail(page, "status")).toHaveText("In flight");
  await expect(flightDetail(page, "altitude")).toHaveText("10.000 m");
  await expect(flightDetail(page, "ground-speed")).toHaveText("250 m/s");
  await expect(flightDetail(page, "track")).toHaveText("180°");
  await expect(flightDetail(page, "vertical-speed")).toHaveText("0 m/s");
  await expect(flightDetail(page, "longitude")).toHaveText("10.5");
  await expect(flightDetail(page, "latitude")).toHaveText("56");
});

// ===============================================
// US4 - Handle errors when retrieving flight data
// ===============================================

test("preserves previous flight data when API refresh fails", async ({
  page,
}) => {
  // Given: The API initially returns one flight,
  // but the next request will fail with HTTP 500.
  const flight = createFlight({
    callsign: "PRESERVED123",
  });

  await mockFlightApi(page, {
    snapshots: [{ flights: [flight] }, { status: 500 }],
  });

  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");

  await expect(page.locator(".flight-list-item")).toContainText("PRESERVED123");

  // When: The dashboard attempts to refresh flight data.
  await page.evaluate(async () => {
    const element = document.querySelector('[x-data="flightDashboard"]');

    const dashboard = window.Alpine.$data(element);

    await dashboard.refreshFlights();
  });

  // Then: The previous flight data is preserved
  // and the dashboard displays an appropriate error message.
  await expect(page.locator("header p")).toHaveText(
    "Unable to retrieve latest flight data. Showing previous data.",
  );

  await expect(page.locator(".flight-list-item")).toHaveCount(1);

  await expect(page.locator(".flight-list-item")).toContainText("PRESERVED123");
});
