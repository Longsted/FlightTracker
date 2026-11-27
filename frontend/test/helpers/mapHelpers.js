import { expect } from "@playwright/test";

// Gets the SVG used by a flight marker.
export async function getFlightMarkerSvg(page, icao24) {
  return page.evaluate((icao24) => {
    const map = window.__OL_MAP__;
    const flightLayer = map.getLayers().item(1);
    const feature = flightLayer.getSource().getFeatureById(icao24);

    const src = feature.getStyle().getImage().getSrc();

    return decodeURIComponent(src.split(",")[1]);
  }, icao24);
}

// Waits for OpenLayers to finish rendering the map.
export async function waitForMapRender(page) {
  await page.evaluate(() => {
    const map = window.__OL_MAP__;

    return new Promise((resolve) => {
      map.once("rendercomplete", resolve);
      map.renderSync();
    });
  });
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
export async function getMarkerOpacity(page, icao24) {
  return page.evaluate((id) => {
    const map = window.__OL_MAP__;
    const flightLayer = map.getLayers().item(1);
    const feature = flightLayer.getSource().getFeatureById(id);

    return feature.getStyle().getImage().getOpacity();
  }, icao24);
}
export async function getMarkerOpacities(page) {
  return page.evaluate(() => {
    const source = window.__OL_MAP__.getLayers().item(1).getSource();

    return Object.fromEntries(
      source
        .getFeatures()
        .map((feature) => [
          feature.getId(),
          feature.getStyle().getImage().getOpacity(),
        ]),
    );
  });
}
