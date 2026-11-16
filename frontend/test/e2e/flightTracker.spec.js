import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Avoid external tile-server dependencies.
  // The flight API itself is NOT mocked.
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: `
        <svg xmlns="http://www.w3.org/2000/svg"
             width="1" height="1">
          <rect width="1" height="1" fill="transparent"/>
        </svg>
      `,
    }),
  );
});

const flightItems = (page) => page.locator(".flight-list-item");

const flightDetail = (page, field) => page.getByTestId(`flight-${field}`);

async function getMarkerOpacity(page, icao24) {
  return page.evaluate((id) => {
    const map = window.__OL_MAP__;
    const flightLayer = map.getLayers().item(1);
    const feature = flightLayer.getSource().getFeatureById(id);

    return feature.getStyle().getImage().getOpacity();
  }, icao24);
}

// US1: Display flights from the real backend.
test("displays the simulated flights received from the backend", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 3 flights");
  await expect(flightItems(page)).toHaveCount(3);

  await expect(flightItems(page).filter({ hasText: "SAS123" })).toBeVisible();
  await expect(flightItems(page).filter({ hasText: "DLH456" })).toBeVisible();
  await expect(flightItems(page).filter({ hasText: "BAW789" })).toBeVisible();

  await expect(page.locator("#flight-map")).toBeVisible();
});

// US3: Select a flight and display its details.
test("displays details when selecting a flight from the flight list", async ({
  page,
}) => {
  await page.goto("/");

  await flightItems(page).filter({ hasText: "DLH456" }).click();

  await expect(page.locator(".details-content")).toBeVisible();

  await expect(flightDetail(page, "callsign")).toHaveText("DLH456");
  await expect(flightDetail(page, "icao24")).toHaveText("def456");
  await expect(flightDetail(page, "origin-country")).toHaveText("Germany");
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

  await page.getByRole("searchbox", { name: "Search flights" }).fill("SAS123");

  const searchResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/flights/search" &&
      response.status() === 200,
  );

  await page.getByRole("button", { name: "Search", exact: true }).click();

  const response = await searchResponse;
  const results = await response.json();

  expect(results).toHaveLength(1);
  expect(results[0].callsign).toBe("SAS123");

  await expect(flightItems(page)).toHaveCount(1);
  await expect(flightItems(page).first()).toContainText("SAS123");
  await expect(page.locator(".flight-list-meta")).toContainText(
    "1 search results",
  );

  await page.getByRole("button", { name: "Clear search" }).click();

  await expect(flightItems(page)).toHaveCount(3);
});

// US5: Display an empty state when the search has no matches.
test("displays a message when a search returns no flights", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("searchbox", { name: "Search flights" })
    .fill("NO-SUCH-FLIGHT");

  const searchResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/flights/search" &&
      response.status() === 200,
  );

  await page.getByRole("button", { name: "Search", exact: true }).click();
  await searchResponse;

  await expect(flightItems(page)).toHaveCount(0);
  await expect(page.locator(".empty-state")).toHaveText(
    "No matching flights found.",
  );
});

// US6: Filter flights by country and verify map marker visibility.
test("filters flight markers by origin country", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 3 flights");

  const filterResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/flights/filter" &&
      response.status() === 200,
  );

  await page.locator("#originCountry").selectOption("Germany");

  const response = await filterResponse;
  const filteredFlights = await response.json();

  expect(filteredFlights).toHaveLength(1);
  expect(filteredFlights[0].icao24).toBe("def456");

  // Germany remains visible; the other two markers are hidden.
  await expect.poll(() => getMarkerOpacity(page, "def456")).toBe(1);
  await expect.poll(() => getMarkerOpacity(page, "abc123")).toBe(0);
  await expect.poll(() => getMarkerOpacity(page, "ghi789")).toBe(0);

  // Clearing filters restores all markers.
  await page.getByRole("button", { name: "Clear filters" }).click();

  await expect.poll(() => getMarkerOpacity(page, "abc123")).toBe(1);
  await expect.poll(() => getMarkerOpacity(page, "def456")).toBe(1);
  await expect.poll(() => getMarkerOpacity(page, "ghi789")).toBe(1);
});
