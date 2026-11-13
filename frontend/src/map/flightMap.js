import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Icon, Style } from "ol/style";
import airplaneSvg from "../assets/airplane.svg?raw";
import Attribution from "ol/control/Attribution";
import { getAltitudeColor, headingToRadians } from "./flightStyle.js";

let flightSource;
let map;

let highlightedIds = null;
let previousView = null;

const MAP_CENTER = [10.5, 56.0];
const MAP_INITIAL_ZOOM = 6;
const SEARCH_ZOOM = 9;

const AIRCRAFT_ICON_SCALE = 0.7;
const AIRCRAFT_ICON_ANCHOR = [0.5, 0.5];

function createFlightFeature(flight) {
  const feature = new Feature({
    geometry: new Point(fromLonLat([flight.longitude, flight.latitude])),
  });

  feature.setId(flight.icao24);
  feature.set("flight", flight);
  feature.setStyle(getFeatureStyle(flight));

  return feature;
}

export function createFlightMap(flights) {
  const features = flights.map(createFlightFeature);

  flightSource = new VectorSource({
    features,
  });

  const flightLayer = new VectorLayer({
    source: flightSource,
  });

  map = new Map({
    target: "flight-map",
    controls: [
      new Attribution({
        className: "ol-attribution custom-attribution",
      }),
    ],
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      flightLayer,
    ],
    view: new View({
      center: fromLonLat(MAP_CENTER),
      zoom: MAP_INITIAL_ZOOM,
    }),
  });

  if (import.meta.env.MODE === "test") {
    window.__OL_MAP__ = map;
    window.__OL_FROM_LON_LAT__ = fromLonLat;
  }

  // OpenLayers handles map clicks.
  map.on("singleclick", async (event) => {
    const features = await flightLayer.getFeatures(event.pixel);
    const feature = features[0];

    window.dispatchEvent(
      new CustomEvent("asset-clicked", {
        detail: feature ? feature.get("flight") : null,
      }),
    );
  });

  return map;
}

export function updateFlights(flights) {
  if (!flightSource) {
    return;
  }

  if (!Array.isArray(flights)) {
    throw new TypeError("Flights must be an array");
  }

  const newFeatures = [];
  const currentIds = new Set();

  flights.forEach((flight) => {
    const existingFeature = flightSource.getFeatureById(flight.icao24);

    currentIds.add(flight.icao24);

    if (existingFeature) {
      const newCoordinates = fromLonLat([flight.longitude, flight.latitude]);

      const geometry = existingFeature.getGeometry();
      const previousCoordinates = geometry.getCoordinates();

      if (
        previousCoordinates[0] !== newCoordinates[0] ||
        previousCoordinates[1] !== newCoordinates[1]
      ) {
        geometry.setCoordinates(newCoordinates);
      }

      existingFeature.set("flight", flight);
      existingFeature.setStyle(getFeatureStyle(flight));
    } else {
      newFeatures.push(createFlightFeature(flight));
    }
  });

  if (newFeatures.length > 0) {
    flightSource.addFeatures(newFeatures);
  }

  const removedFeatures = flightSource
    .getFeatures()
    .filter((feature) => !currentIds.has(feature.getId()));

  if (removedFeatures.length > 0) {
    flightSource.removeFeatures(removedFeatures);
  }

  // Reapply search highlighting after updating the flight data.
  applySearchHighlighting();
}

export function highlightFlights(icao24s) {
  if (!map || !flightSource) {
    return;
  }

  // Save the current map view only when entering search mode.
  if (highlightedIds === null) {
    const view = map.getView();

    previousView = {
      center: view.getCenter(),
      zoom: view.getZoom(),
    };
  }

  highlightedIds = new Set(icao24s);
  applySearchHighlighting();
}

export function clearFlightHighlights() {
  if (!map || !flightSource) {
    return;
  }

  highlightedIds = null;
  applySearchHighlighting();

  if (previousView) {
    const view = map.getView();

    view.animate({
      center: previousView.center,
      zoom: previousView.zoom,
      duration: 500,
    });

    previousView = null;
  }
}

export function zoomToFlight(flight) {
  if (!map || !flight || flight.longitude == null || flight.latitude == null) {
    return;
  }

  map.getView().animate({
    center: fromLonLat([flight.longitude, flight.latitude]),
    zoom: Math.max(map.getView().getZoom(), SEARCH_ZOOM),
    duration: 500,
  });
}

function applySearchHighlighting() {
  if (!flightSource) {
    return;
  }

  flightSource.getFeatures().forEach((feature) => {
    const flight = feature.get("flight");

    const isDimmed =
      highlightedIds !== null && !highlightedIds.has(flight.icao24);

    feature.setStyle(getFeatureStyle(flight, isDimmed ? 0 : 1));
  });
}

function getFeatureStyle(flight, opacity = 1) {
  const color = getAltitudeColor(flight);
  const coloredSvg = airplaneSvg.replace("#0d6efd", color);
  const svgUrl = `data:image/svg+xml,${encodeURIComponent(coloredSvg)}`;

  return new Style({
    image: new Icon({
      src: svgUrl,
      anchor: AIRCRAFT_ICON_ANCHOR,
      rotation: headingToRadians(flight.heading),
      scale: AIRCRAFT_ICON_SCALE,
      opacity,
    }),
  });
}
