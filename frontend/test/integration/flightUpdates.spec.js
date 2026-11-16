import { test, expect } from "./fixtures/testFixtures.js";
import {
  createFlight,
  mockFlightApi,
  clickFlightPosition,
  flightDetail,
  flightDetailsContent,
} from "./helpers/integrationTestHelpers.js";

// ========================================
// US2 - Update flight positions
// ========================================

test("updates flight position and keeps map interactive", async ({ page }) => {
  const initialFlight = createFlight({
    callsign: "TEST-CENTER",
    longitude: 10.5,
    latitude: 56.0,
  });

  const updatedFlight = createFlight({
    callsign: "TEST-UPDATED",
    longitude: 13.0,
    latitude: 58.0,
  });

  await page.clock.install();

  const getRequestCount = await mockFlightApi(page, {
    snapshots: [[initialFlight], [updatedFlight]],
  });

  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");
  await expect.poll(getRequestCount).toBe(1);

  // Select the flight before the update.
  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeVisible();
  await expect(flightDetail(page, "callsign")).toHaveText("TEST-CENTER");

  // Advance the clock by the 120-second polling interval.
  await page.clock.fastForward(120_000);

  await expect.poll(getRequestCount).toBe(2);

  // Verify that the selected flight details have been updated.
  await expect(flightDetail(page, "callsign")).toHaveText("TEST-UPDATED");
  await expect(flightDetail(page, "longitude")).toHaveText("13");
  await expect(flightDetail(page, "latitude")).toHaveText("58");

  // Verify that the marker can still be selected at its new position.
  await clickFlightPosition(page, 13.0, 58.0);

  await expect(flightDetailsContent(page)).toBeVisible();
  await expect(flightDetail(page, "callsign")).toHaveText("TEST-UPDATED");
});

test("removes selected flight when it disappears from snapshot", async ({
  page,
}) => {
  const flight = createFlight({
    callsign: "TEST-CENTER",
    longitude: 10.5,
    latitude: 56.0,
  });

  await page.clock.install();

  const getRequestCount = await mockFlightApi(page, {
    snapshots: [[flight], []],
  });

  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");
  await expect.poll(getRequestCount).toBe(1);

  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeVisible();

  // The next snapshot no longer contains the flight.
  await page.clock.fastForward(120_000);

  await expect.poll(getRequestCount).toBe(2);

  await expect(page.locator("header p")).toHaveText(
    "No flights currently available",
  );

  await expect(flightDetailsContent(page)).toBeHidden();

  // The removed marker should no longer be selectable.
  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeHidden();
});

test("continues updating flights after a failed API request", async ({
  page,
}) => {
  const initialFlight = createFlight({
    callsign: "TEST-INITIAL",
    longitude: 10.5,
    latitude: 56.0,
  });

  const updatedFlight = createFlight({
    callsign: "TEST-UPDATED",
    longitude: 13.0,
    latitude: 58.0,
  });

  await page.clock.install();

  const getRequestCount = await mockFlightApi(page, {
    snapshots: [[initialFlight], { status: 500 }, [updatedFlight]],
  });

  await page.goto("/");

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");
  await expect.poll(getRequestCount).toBe(1);

  // The second request fails.
  await page.clock.fastForward(120_000);

  await expect.poll(getRequestCount).toBe(2);

  await expect(page.locator("header p")).toHaveText(
    "Could not retrieve flight data",
  );

  // The existing marker should still be interactive after the error.
  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeVisible();
  await expect(flightDetail(page, "callsign")).toHaveText("TEST-INITIAL");

  // The third request succeeds.
  await page.clock.fastForward(120_000);

  await expect.poll(getRequestCount).toBe(3);

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");

  // The new marker should be interactive at its updated position.
  await clickFlightPosition(page, 13.0, 58.0);

  await expect(flightDetailsContent(page)).toBeVisible();
  await expect(flightDetail(page, "callsign")).toHaveText("TEST-UPDATED");
});
