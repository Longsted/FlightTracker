import { test, expect } from "../fixtures/testFixtures.js";
import { flightDetail, flightDetailsContent } from "../helpers/uiHelpers.js";
import {
  API_ENDPOINTS,
  TEST_COUNTRIES,
  TEST_FLIGHTS,
  HTTP_STATUS,
} from "../helpers/testConstants.js";
import { getMarkerOpacity } from "../helpers/mapHelpers.js";
const INITIAL_FLIGHT_COUNT = 3;

const flightItems = (page) => page.locator(".flight-list-item");

// US1: Display flights from the real backend.
test("displays the simulated flights received from the backend", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText(
    `Showing ${INITIAL_FLIGHT_COUNT} flights`,
  );
  await expect(flightItems(page)).toHaveCount(INITIAL_FLIGHT_COUNT);

  await expect(
    flightItems(page).filter({ hasText: TEST_FLIGHTS.SAS.callsign }),
  ).toBeVisible();
  await expect(
    flightItems(page).filter({ hasText: TEST_FLIGHTS.LUFTHANSA.callsign }),
  ).toBeVisible();
  await expect(
    flightItems(page).filter({
      hasText: TEST_FLIGHTS.BRITISH_AIRWAYS.callsign,
    }),
  ).toBeVisible();

  await expect(page.locator("#flight-map")).toBeVisible();
});

// US3: Select a flight and display its details.
test("displays details when selecting a flight from the flight list", async ({
  page,
}) => {
  await page.goto("/");

  await flightItems(page)
    .filter({ hasText: TEST_FLIGHTS.LUFTHANSA.callsign })
    .click();

  await expect(flightDetailsContent(page)).toBeVisible();

  await expect(flightDetail(page, "callsign")).toHaveText(
    TEST_FLIGHTS.LUFTHANSA.callsign,
  );
  await expect(flightDetail(page, "icao24")).toHaveText(
    TEST_FLIGHTS.LUFTHANSA.icao24,
  );
  await expect(flightDetail(page, "origin-country")).toHaveText(
    TEST_COUNTRIES.GERMANY,
  );
  await expect(flightDetail(page, "status")).toHaveText("In flight");
  await expect(flightDetail(page, "altitude")).toHaveText("11.000 m");
  await expect(flightDetail(page, "ground-speed")).toHaveText("245 m/s");
  await expect(flightDetail(page, "track")).toHaveText("180°");
});

// US5: Search for a flight by callsign.
test("searches for a flight by callsign and restores the list when cleared", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("searchbox", { name: "Search flights" })
    .fill(TEST_FLIGHTS.SAS.callsign);

  const searchResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === API_ENDPOINTS.SEARCH &&
      response.status() === HTTP_STATUS.OK,
  );

  await page.getByRole("button", { name: "Search", exact: true }).click();

  const response = await searchResponse;
  const results = await response.json();

  expect(results).toHaveLength(1);
  expect(results[0].callsign).toBe(TEST_FLIGHTS.SAS.callsign);

  await expect(flightItems(page)).toHaveCount(1);
  await expect(flightItems(page).first()).toContainText(
    TEST_FLIGHTS.SAS.callsign,
  );
  await expect(page.locator(".flight-list-meta")).toContainText(
    "1 search results",
  );

  await page.getByRole("button", { name: "Clear search" }).click();

  await expect(flightItems(page)).toHaveCount(INITIAL_FLIGHT_COUNT);
});

// US5: Display an empty state when the search has no matches.
test("displays a message when a search returns no flights", async ({
  page,
}) => {
  await page.goto("/");

  const searchResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === API_ENDPOINTS.SEARCH &&
      response.status() === HTTP_STATUS.OK,
  );
  await page
    .getByRole("searchbox", { name: "Search flights" })
    .fill("NO-SUCH-FLIGHT");

  await page.getByRole("button", { name: "Search", exact: true }).click();
  await searchResponsePromise;

  await expect(flightItems(page)).toHaveCount(0);
  await expect(page.locator(".empty-state")).toHaveText(
    "No matching flights found.",
  );
});

// US6: Filter flights by country and verify map marker visibility.
test("filters flight markers by origin country", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText(
    `Showing ${INITIAL_FLIGHT_COUNT} flights`,
  );

  const filterResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === API_ENDPOINTS.FILTER &&
      response.status() === HTTP_STATUS.OK,
  );

  await page.locator("#originCountry").selectOption(TEST_COUNTRIES.GERMANY);

  const response = await filterResponse;
  const filteredFlights = await response.json();

  expect(filteredFlights).toHaveLength(1);
  expect(filteredFlights[0].icao24).toBe(TEST_FLIGHTS.LUFTHANSA.icao24);

  // Germany remains visible; the other two markers are hidden.
  await expect
    .poll(() => getMarkerOpacity(page, TEST_FLIGHTS.LUFTHANSA.icao24))
    .toBe(1);
  await expect
    .poll(() => getMarkerOpacity(page, TEST_FLIGHTS.SAS.icao24))
    .toBe(0);
  await expect
    .poll(() => getMarkerOpacity(page, TEST_FLIGHTS.BRITISH_AIRWAYS.icao24))
    .toBe(0);

  // Clearing filters restores all markers.
  await page.getByRole("button", { name: "Clear filters" }).click();

  await expect
    .poll(() => getMarkerOpacity(page, TEST_FLIGHTS.SAS.icao24))
    .toBe(1);
  await expect
    .poll(() => getMarkerOpacity(page, TEST_FLIGHTS.LUFTHANSA.icao24))
    .toBe(1);
  await expect
    .poll(() => getMarkerOpacity(page, TEST_FLIGHTS.BRITISH_AIRWAYS.icao24))
    .toBe(1);
});
test("recovers when the backend becomes available after being unavailable", async ({
  page,
}) => {
  // Given: The backend is initially unavailable.
  const flight = {
    icao24: "abc123",
    callsign: "RECOVER123",
    originCountry: "Denmark",
    timePosition: 1730000000,
    lastContact: 1730000000,
    longitude: 12.5683,
    latitude: 55.6761,
    barometricAltitude: 10000,
    onGround: false,
    velocity: 250,
    heading: 180,
    verticalRate: 0,
  };

  let requestCount = 0;

  await page.clock.install();

  await page.route("**/api/flights", async (route) => {
    requestCount++;

    if (requestCount === 1) {
      await route.fulfill({
        status: 503,
        body: JSON.stringify({ error: "Service unavailable" }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([flight]),
      });
    }
  });

  await page.route("**/api/flights/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ available: true }),
    }),
  );

  await page.goto("/");

  // Then: The initial request fails.
  await expect.poll(() => requestCount).toBe(1);

  // When: The first retry delay has elapsed.
  await page.clock.runFor(5000);

  // Then: The frontend retries and displays the recovered flight.
  await expect.poll(() => requestCount).toBe(2);
  await expect(flightItems(page)).toContainText("RECOVER123");
  await expect(page.locator("header p")).toHaveText("Showing 1 flights");
});
