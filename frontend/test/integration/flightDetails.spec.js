import { test, expect } from "./fixtures/testFixtures.js";
import {
  createFlight,
  mockFlightApi,
  clickFlightPosition,
  flightDetail,
  flightDetailsContent,
  getFlightMarkerSvg,
  waitForMapRender,
} from "./helpers/integrationTestHelpers.js";

// ========================================
// US3 - Selected flight details
// ========================================

test("updates flight details when selecting another flight", async ({
  page,
}) => {
  const firstFlight = createFlight({
    icao24: "abc123",
    callsign: "FIRST123",
    longitude: 10.5,
    latitude: 56.0,
  });

  const secondFlight = createFlight({
    icao24: "def456",
    callsign: "SECOND456",
    longitude: 13.0,
    latitude: 58.0,
  });

  await mockFlightApi(page, {
    flights: [firstFlight, secondFlight],
  });

  await page.goto("/");

  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetail(page, "callsign")).toHaveText("FIRST123");

  await clickFlightPosition(page, 13.0, 58.0);

  await expect(flightDetail(page, "callsign")).toHaveText("SECOND456");
  await expect(flightDetail(page, "icao24")).toHaveText("def456");
});

test("displays unavailable for missing flight details", async ({ page }) => {
  const flight = createFlight({
    longitude: 10.5,
    latitude: 56.0,
    callsign: null,
    originCountry: null,
    barometricAltitude: null,
    velocity: null,
    heading: null,
    verticalRate: null,
  });

  await mockFlightApi(page, { flights: [flight] });
  await page.goto("/");

  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetail(page, "callsign")).toHaveText("Unavailable");
  await expect(flightDetail(page, "origin-country")).toHaveText("Unavailable");
  await expect(flightDetail(page, "altitude")).toHaveText("Unavailable");
  await expect(flightDetail(page, "ground-speed")).toHaveText("Unavailable");
  await expect(flightDetail(page, "track")).toHaveText("Unavailable");
  await expect(flightDetail(page, "vertical-speed")).toHaveText("Unavailable");
});

test("keeps flight selectable when altitude is missing", async ({ page }) => {
  const flight = createFlight({
    longitude: 10.5,
    latitude: 56.0,
    barometricAltitude: null,
  });

  await mockFlightApi(page, { flights: [flight] });
  await page.goto("/");

  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeVisible();
  await expect(flightDetail(page, "callsign")).toHaveText("TEST123");
  await expect(flightDetail(page, "altitude")).toHaveText("Unavailable");
});

test("displays available details when some flight data is missing", async ({
  page,
}) => {
  const flight = createFlight({
    longitude: 10.5,
    latitude: 56.0,
    barometricAltitude: null,
    velocity: null,
  });

  await mockFlightApi(page, { flights: [flight] });
  await page.goto("/");

  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetail(page, "callsign")).toHaveText("TEST123");
  await expect(flightDetail(page, "icao24")).toHaveText("abc123");
  await expect(flightDetail(page, "altitude")).toHaveText("Unavailable");
  await expect(flightDetail(page, "ground-speed")).toHaveText("Unavailable");
  await expect(flightDetail(page, "track")).toHaveText("180°");
  await expect(flightDetail(page, "vertical-speed")).toHaveText("0 m/s");
});

test("preserves map view when flights are updated", async ({ page }) => {
  const initialFlight = createFlight();
  const updatedFlight = createFlight({
    longitude: 13.0,
    latitude: 58.0,
  });

  await page.clock.install();

  const getRequestCount = await mockFlightApi(page, {
    snapshots: [[initialFlight], [updatedFlight]],
  });

  await page.goto("/");

  await expect.poll(getRequestCount).toBe(1);

  // Pan and zoom the map.
  const initialView = await page.evaluate(() => {
    const map = window.__OL_MAP__;
    const view = map.getView();

    view.setCenter(window.__OL_FROM_LON_LAT__([8.0, 54.0]));
    view.setZoom(8);

    return {
      center: view.getCenter(),
      zoom: view.getZoom(),
    };
  });

  await waitForMapRender(page);

  // Trigger the next flight update.
  await page.clock.fastForward(120_000);
  await expect.poll(getRequestCount).toBe(2);

  await waitForMapRender(page);

  // Verify that the map view was preserved.
  const updatedView = await page.evaluate(() => {
    const view = window.__OL_MAP__.getView();

    return {
      center: view.getCenter(),
      zoom: view.getZoom(),
    };
  });

  expect(updatedView.center).toEqual(initialView.center);
  expect(updatedView.zoom).toBe(initialView.zoom);
});

test("deselects flight when clicking empty map area", async ({ page }) => {
  const flight = createFlight({
    longitude: 10.5,
    latitude: 56.0,
  });

  await mockFlightApi(page, { flights: [flight] });
  await page.goto("/");

  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeVisible();

  // Click an empty area away from the selected marker.
  const bounds = await page.locator("#flight-map").boundingBox();

  await page.mouse.click(
    bounds.x + bounds.width / 2 + 100,
    bounds.y + bounds.height / 2 + 100,
  );

  await expect(flightDetailsContent(page)).toBeHidden();
});

// ========================================
// Marker colors
// ========================================

test("displays marker colors according to altitude", async ({ page }) => {
  const flights = [
    createFlight({
      icao24: "ground",
      onGround: true,
      barometricAltitude: 1000,
    }),
    createFlight({
      icao24: "low",
      barometricAltitude: 1000,
    }),
    createFlight({
      icao24: "high",
      barometricAltitude: 13000,
    }),
  ];

  await mockFlightApi(page, { flights });
  await page.goto("/");

  const expectedColors = [
    ["ground", "blue"],
    ["low", "rgb(101, 191, 65)"],
    ["high", "rgb(239, 68, 68)"],
  ];

  for (const [icao24, color] of expectedColors) {
    const svg = await getFlightMarkerSvg(page, icao24);

    expect(svg).toContain(`fill="${color}"`);
  }
});

test("updates marker color when altitude changes", async ({ page }) => {
  const initialFlight = createFlight({
    barometricAltitude: 1000,
  });

  const updatedFlight = createFlight({
    barometricAltitude: 9000,
  });

  await page.clock.install();

  const getRequestCount = await mockFlightApi(page, {
    snapshots: [[initialFlight], [updatedFlight]],
  });

  await page.goto("/");

  await expect.poll(getRequestCount).toBe(1);

  const initialSvg = await getFlightMarkerSvg(page, "abc123");
  expect(initialSvg).toContain('fill="rgb(101, 191, 65)"');

  // Trigger the next flight update.
  await page.clock.fastForward(120_000);

  await expect
    .poll(async () => {
      const svg = await getFlightMarkerSvg(page, "abc123");
      return svg.includes('fill="rgb(244, 92, 45)"');
    })
    .toBe(true);
});

test("displays altitude legend on the flight map", async ({ page }) => {
  await mockFlightApi(page, { flights: [] });

  await page.goto("/");

  const legend = page.locator(".map-info-panel");

  await expect(legend).toBeVisible();
  await expect(legend).toContainText("Flight altitude");
  await expect(legend).toContainText("0 m");
  await expect(legend).toContainText("3.000 m");
  await expect(legend).toContainText("6.000 m");
  await expect(legend).toContainText("12.000 m+");
  await expect(legend).toContainText("On ground");
  await expect(legend).toContainText("Unknown altitude");
});
