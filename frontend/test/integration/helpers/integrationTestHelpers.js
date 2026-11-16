import { expect } from "@playwright/test";

/**
 * Mocks the search and filter endpoints.
 * Responses can be configured independently for each test.
 */
export async function mockSearchAndFilterApi(
  page,
  { searchResults = [], filteredFlights = [] } = {},
) {
  let searchRequestCount = 0;
  let filterRequestCount = 0;

  const searchRequests = [];
  const filterRequests = [];

  await page.route("**/api/flights/search**", async (route) => {
    searchRequestCount++;

    const url = new URL(route.request().url());
    searchRequests.push({
      query: url.searchParams.get("query"),
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchResults),
    });
  });

  await page.route("**/api/flights/filter**", async (route) => {
    filterRequestCount++;

    const url = new URL(route.request().url());

    filterRequests.push(Object.fromEntries(url.searchParams.entries()));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(filteredFlights),
    });
  });

  return {
    searchRequestCount: () => searchRequestCount,
    filterRequestCount: () => filterRequestCount,
    searchRequests,
    filterRequests,
  };
}

export async function getFlightMarkerSvg(page, icao24) {
  return page.evaluate((icao24) => {
    const map = window.__OL_MAP__;
    const flightLayer = map.getLayers().item(1);
    const feature = flightLayer.getSource().getFeatureById(icao24);

    const src = feature.getStyle().getImage().getSrc();

    return decodeURIComponent(src.split(",")[1]);
  }, icao24);
}

export async function waitForMapRender(page) {
  await page.evaluate(() => {
    const map = window.__OL_MAP__;

    return new Promise((resolve) => {
      map.once("rendercomplete", resolve);
      map.renderSync();
    });
  });
}

export function flightDetail(page, field) {
  return page.getByTestId(`flight-${field}`);
}

export function flightDetailsContent(page) {
  return page.locator(".details-content");
}

// Creates a flight with default test data.
// Individual properties can be overridden when needed.
export function createFlight(overrides = {}) {
  return {
    icao24: "abc123",
    callsign: "TEST123",
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
    ...overrides,
  };
}

// Mocks the flight API with controlled snapshots and HTTP status.
// Each snapshot can be an array of flights or an object containing
// a status and flights property.
export async function mockFlightApi(
  page,
  { status = 200, flights = [], snapshots } = {},
) {
  let requestCount = 0;

  await page.route("**/api/flights", async (route) => {
    const snapshot = snapshots
      ? snapshots[Math.min(requestCount, snapshots.length - 1)]
      : { status, flights };

    requestCount++;

    const currentStatus = Array.isArray(snapshot)
      ? 200
      : (snapshot.status ?? 200);

    const currentFlights = Array.isArray(snapshot)
      ? snapshot
      : (snapshot.flights ?? []);

    await route.fulfill({
      status: currentStatus,
      contentType: "application/json",
      body: JSON.stringify(
        currentStatus === 200
          ? currentFlights
          : { error: "Internal Server Error" },
      ),
    });
  });

  return () => requestCount;
}

// Clicks a flight at its geographic position.
export async function clickFlightPosition(page, longitude, latitude) {
  const mapElement = page.locator("#flight-map");

  await expect(mapElement.locator(".ol-viewport")).toBeVisible();
  await waitForMapRender(page);

  const pixel = await page.evaluate(
    ([longitude, latitude]) => {
      const map = window.__OL_MAP__;
      const coordinate = window.__OL_FROM_LON_LAT__([longitude, latitude]);

      return map.getPixelFromCoordinate(coordinate);
    },
    [longitude, latitude],
  );

  const bounds = await mapElement.boundingBox();

  await page.mouse.click(bounds.x + pixel[0], bounds.y + pixel[1]);
}
