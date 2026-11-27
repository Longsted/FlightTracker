import { test, expect } from "../fixtures/testFixtures.js";
import {
  createFlight,
  mockFlightApi,
  mockSearchAndFilterApi,
} from "./helpers/integrationTestHelpers.js";
import { TEST_FLIGHTS } from "../helpers/testConstants.js";
// ========================================
// Flight search
// ========================================

test("finds flights by partial callsign regardless of letter case", async ({
  page,
}) => {
  // Given: Multiple flights are available.
  const flights = [
    createFlight({ ...TEST_FLIGHTS.SAS }),
    createFlight({ ...TEST_FLIGHTS.LUFTHANSA }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    searchResults: [flights[0]],
  });

  await page.goto("/");

  // When: The user searches for part of a callsign.
  await page.getByRole("searchbox", { name: "Search flights" }).fill("sas");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  // Then: The search endpoint receives the query.
  await expect.poll(() => apiMock.searchRequestCount()).toBe(1);
  expect(apiMock.searchRequests[0].query).toBe("sas");

  // Then: Only the matching flight is displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText("SAS123");
});

test("finds flights by ICAO24", async ({ page }) => {
  // Given: Multiple flights are available.
  const flights = [
    createFlight({ ...TEST_FLIGHTS.SAS }),
    createFlight({ ...TEST_FLIGHTS.LUFTHANSA }),
  ];

  await mockFlightApi(page, { flights });

  const apiMock = await mockSearchAndFilterApi(page, {
    searchResults: [flights[1]],
  });

  await page.goto("/");

  // When: The user searches using an ICAO24 identifier.
  await page.getByRole("searchbox", { name: "Search flights" }).fill("def456");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  // Then: The search endpoint receives the identifier.
  await expect.poll(() => apiMock.searchRequestCount()).toBe(1);
  expect(apiMock.searchRequests[0].query).toBe("def456");

  // Then: The corresponding flight is displayed.
  await expect(page.locator(".flight-list-item")).toHaveCount(1);
  await expect(page.locator(".flight-list-item")).toContainText(
    TEST_FLIGHTS.LUFTHANSA.callsign,
  );
  await expect(page.locator(".flight-list-item")).toContainText(
    TEST_FLIGHTS.LUFTHANSA.icao24,
  );
});

test("displays a message when no flights match the search", async ({
  page,
}) => {
  // Given: A flight is available, but the search returns no results.
  await mockFlightApi(page, {
    flights: [createFlight({ ...TEST_FLIGHTS.SAS })],
  });

  const apiMock = await mockSearchAndFilterApi(page, {
    searchResults: [],
  });

  await page.goto("/");

  // When: The user searches for a flight that does not exist.
  await page.getByRole("searchbox", { name: "Search flights" }).fill("UNKNOWN");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  // Then: The search endpoint receives the query.
  await expect.poll(() => apiMock.searchRequestCount()).toBe(1);

  // Then: No flights are displayed and an empty-state message appears.
  await expect(page.locator(".flight-list-item")).toHaveCount(0);
  await expect(page.locator(".flight-list")).toContainText(
    "No matching flights found.",
  );
});

test("clears the search and restores all available flights", async ({
  page,
}) => {
  // Given: Multiple flights are available and a search has been performed.
  const flights = [
    createFlight({ ...TEST_FLIGHTS.SAS }),
    createFlight({ ...TEST_FLIGHTS.LUFTHANSA }),
  ];

  await mockFlightApi(page, { flights });

  await mockSearchAndFilterApi(page, {
    searchResults: [flights[0]],
  });

  await page.goto("/");

  await page.getByRole("searchbox", { name: "Search flights" }).fill("SAS");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.locator(".flight-list-item")).toHaveCount(1);

  // When: The user clears the search.
  await page.getByRole("button", { name: "Clear search" }).click();

  // Then: The complete flight list is restored.
  await expect(page.locator(".flight-list-item")).toHaveCount(2);
  await expect(
    page.getByRole("searchbox", { name: "Search flights" }),
  ).toHaveValue("");
});
