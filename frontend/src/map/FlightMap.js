import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import { Circle, Fill, Stroke, Style } from 'ol/style'

const sampleFlights = [
  { callsign: 'SAS123', longitude: 10.7522, latitude: 56.2639 },
  { callsign: 'DLH456', longitude: 12.5683, latitude: 55.6761 },
  { callsign: 'KLM789', longitude: 9.9217, latitude: 57.0488 },
]

export function createFlightMap() {
  const features = sampleFlights.map((flight) => {
    const feature = new Feature({
      geometry: new Point(
        fromLonLat([flight.longitude, flight.latitude]),
      ),
    })

    // OpenLayers-featuret indeholder de tilhørende flydata.
    feature.set('flight', flight)

    feature.setStyle(
      new Style({
        image: new Circle({
          radius: 7,
          fill: new Fill({ color: '#0d6efd' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }),
    )

    return feature
  })

  const flightSource = new VectorSource({
    features,
  })

  const flightLayer = new VectorLayer({
    source: flightSource,
  })

  const map = new Map({
    target: 'flight-map',
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      flightLayer,
    ],
    view: new View({
      center: fromLonLat([10.5, 56.0]),
      zoom: 6,
    }),
  })

  // OpenLayers håndterer klik på kortets flymarkører.
  map.on('singleclick', (event) => {
    const feature = map.forEachFeatureAtPixel(
      event.pixel,
      (candidate, layer) => {
        if (layer === flightLayer) {
          return candidate
        }

        return undefined
      },
    )

    if (!feature) {
      return
    }

    // Send de valgte flydata videre til UI-laget.
    window.dispatchEvent(
      new CustomEvent('asset-clicked', {
        detail: feature.get('flight'),
      }),
    )
  })

  return map
}