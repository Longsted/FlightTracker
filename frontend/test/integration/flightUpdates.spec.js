import { test, expect } from "../fixtures/testFixtures.js";
import {
  createFlight,
  mockFlightApi,
} from "./helpers/integrationTestHelpers.js";

import { clickFlightPosition } from "../helpers/mapHelpers.js";
import { flightDetail, flightDetailsContent } from "../helpers/uiHelpers.js";

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
    snapshots: [
      [initialFlight],
      { status: 500 },
      { status: 500 },
      { status: 500 },
      { status: 500 },
      [updatedFlight],
    ],
  });

  await page.goto("/");

  // Initial request succeeds.
  await expect(page.locator("header p")).toHaveText("Showing 1 flights");
  await expect.poll(getRequestCount).toBe(1);

  // The second request fails after 120 seconds.
  await page.clock.runFor(120_000);
  await expect.poll(getRequestCount).toBe(2);

  // First retry.
  await page.clock.runFor(5000);
  await expect.poll(getRequestCount).toBe(3);

  // Second retry.
  await page.clock.runFor(10000);
  await expect.poll(getRequestCount).toBe(4);

  // Third retry.
  await page.clock.runFor(15000);
  await expect.poll(getRequestCount).toBe(5);

  await expect(page.locator("header p")).toHaveText(
    "Unable to retrieve latest flight data. Showing previous data.",
  );

  // The existing marker should still be interactive.
  await clickFlightPosition(page, 10.5, 56.0);

  await expect(flightDetailsContent(page)).toBeVisible();
  await expect(flightDetail(page, "callsign")).toHaveText("TEST-INITIAL");

  // The next regular request succeeds at the next 120-second interval.
  await page.clock.runFor(90_000);
  await expect.poll(getRequestCount).toBe(6);

  await expect(page.locator("header p")).toHaveText("Showing 1 flights");

  // The new marker should be interactive at its updated position.
  await clickFlightPosition(page, 13.0, 58.0);

  await expect(flightDetailsContent(page)).toBeVisible();
  await expect(flightDetail(page, "callsign")).toHaveText("TEST-UPDATED");
});
