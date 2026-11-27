import { test, expect } from "../fixtures/testFixtures.js";
import {
  createFlight,
  mockFlightApi,
} from "./helpers/integrationTestHelpers.js";
import { clickFlightPosition } from "../helpers/mapHelpers.js";
import { flightDetail, flightDetailsContent } from "../helpers/uiHelpers.js";
import { TEST_FLIGHTS, TEST_COUNTRIES } from "../helpers/testConstants.js";
// ========================================
// US1 - Display flight data on map
// ========================================

test("displays flight data received from API", async ({ page }) => {
  const flights = [
    createFlight(),
    createFlight({
      ...TEST_FLIGHTS.LUFTHANSA, //Copy flight properties into the new object
      originCountry: TEST_COUNTRIES.GERMANY,
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
  await page.clock.install();

  const getRequestCount = await mockFlightApi(page, { status: 500 });

  await page.goto("/");

  // Initial request fails.
  await expect.poll(getRequestCount).toBe(1);

  // First retry after 5 seconds.
  await page.clock.runFor(5000);
  await expect.poll(getRequestCount).toBe(2);

  // Second retry after another 10 seconds.
  await page.clock.runFor(10000);
  await expect.poll(getRequestCount).toBe(3);

  // Third retry after another 15 seconds.
  await page.clock.runFor(15000);
  await expect.poll(getRequestCount).toBe(4);

  await expect(page.locator("header p")).toHaveText(
    "Flight data is currently unavailable",
  );

  await expect(page.locator("#flight-map")).toBeVisible();
});

test("displays flight marker at its geographic position", async ({ page }) => {
  const flight = createFlight({
    ...TEST_FLIGHTS.SAS,
    originCountry: TEST_COUNTRIES.DENMARK,
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
  await expect(flightDetail(page, "icao24")).toHaveText(
    TEST_FLIGHTS.SAS.icao24,
  );
  await expect(flightDetail(page, "origin-country")).toHaveText(
    TEST_COUNTRIES.DENMARK,
  );
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
  // but all subsequent requests fail with HTTP 500.
  const flight = createFlight({
    callsign: "PRESERVED123",
  });

  await page.clock.install();

  const getRequestCount = await mockFlightApi(page, {
    snapshots: [
      { flights: [flight] },
      { status: 500 },
      { status: 500 },
      { status: 500 },
      { status: 500 },
    ],
  });

  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");
  await expect(page.locator(".flight-list-item")).toContainText("PRESERVED123");

  // Initial request complete.
  await expect.poll(getRequestCount).toBe(1);

  // Start refresh after 120 sec.
  await page.clock.fastForward(120_000);

  // first fail refresh.
  await expect.poll(getRequestCount).toBe(2);

  // First retry after 5 secs.
  await page.clock.runFor(5000);
  await expect.poll(getRequestCount).toBe(3);

  // Second retry after 10 secs.
  await page.clock.runFor(10000);
  await expect.poll(getRequestCount).toBe(4);

  // Third retry after 15 secs.
  await page.clock.runFor(15000);
  await expect.poll(getRequestCount).toBe(5);

  // Then: The previous flight data is preserved
  // and the dashboard displays an appropriate error message.
  await expect(page.locator("header p")).toHaveText(
    "Unable to retrieve latest flight data. Showing previous data.",
  );

  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("PRESERVED123");
});
