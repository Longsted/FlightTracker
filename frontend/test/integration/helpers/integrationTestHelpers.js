import {
  API_ROUTE_PATTERNS,
  HTTP_STATUS,
} from "../../helpers/testConstants.js";

const FLIGHT_STATUS_RESPONSE = {
  available: true,
  lastAttempt: "2026-11-19T10:00:00Z",
  lastSuccessfulUpdate: "2026-11-19T10:00:00Z",
};
const ERROR_RESPONSE = {
  error: "Internal Server Error",
};
/*
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

  await page.route(API_ROUTE_PATTERNS.SEARCH, async (route) => {
    searchRequestCount++;

    const url = new URL(route.request().url());
    searchRequests.push({
      query: url.searchParams.get("query"),
    });

    await route.fulfill({
      status: HTTP_STATUS.OK,
      contentType: "application/json",
      body: JSON.stringify(searchResults),
    });
  });

  await page.route(API_ROUTE_PATTERNS.FILTER, async (route) => {
    filterRequestCount++;

    const url = new URL(route.request().url());

    filterRequests.push(Object.fromEntries(url.searchParams.entries()));

    await route.fulfill({
      status: HTTP_STATUS.OK,
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
  { status = HTTP_STATUS.OK, flights = [], snapshots } = {},
) {
  let requestCount = 0;

  await page.route(API_ROUTE_PATTERNS.FLIGHTS, async (route) => {
    const snapshot = snapshots
      ? snapshots[Math.min(requestCount, snapshots.length - 1)]
      : { status, flights };

    requestCount++;

    const currentStatus = Array.isArray(snapshot)
      ? HTTP_STATUS.OK
      : (snapshot.status ?? HTTP_STATUS.OK);

    const currentFlights = Array.isArray(snapshot)
      ? snapshot
      : (snapshot.flights ?? []);

    await route.fulfill({
      status: currentStatus,
      contentType: "application/json",
      body: JSON.stringify(
        currentStatus === HTTP_STATUS.OK ? currentFlights : ERROR_RESPONSE,
      ),
    });
  });

  await page.route(API_ROUTE_PATTERNS.FLIGHT_STATUS, async (route) => {
    await route.fulfill({
      status: HTTP_STATUS.OK,
      contentType: "application/json",
      body: JSON.stringify(FLIGHT_STATUS_RESPONSE),
    });
  });
  return () => requestCount;
}
