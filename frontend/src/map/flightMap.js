
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import {fromLonLat} from 'ol/proj'
import {Icon, Style} from 'ol/style'

let flightSource

const MAP_CENTER = [10.5, 56.0]
const MAP_INITIAL_ZOOM = 6

const AIRCRAFT_ICON_SCALE = 0.7
const AIRCRAFT_ICON_ANCHOR = [0.5, 0.5]

function createFlightFeature(flight) {
    const feature = new Feature({
        geometry: new Point(
            fromLonLat([flight.longitude, flight.latitude]),
        ),
    })

    feature.setId(flight.icao24)
    feature.set('flight', flight)
    feature.setStyle(getStyle(flight))


    return feature
}

export function createFlightMap(flights) {
    const features = flights.map(createFlightFeature)

    flightSource = new VectorSource({
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
            center: fromLonLat(MAP_CENTER),
            zoom: MAP_INITIAL_ZOOM,
        }),
    })


    // OpenLayers handles clicks
    map.on('singleclick', async (event) => {
        const features = await flightLayer.getFeatures(event.pixel)

        const feature = features[0]

        if (!feature) {
            return
        }

        // Send selected flight data to UI
        window.dispatchEvent(
            new CustomEvent('asset-clicked', {
                detail: feature.get('flight'),
            }),
        )
    })

    return map
}

export function updateFlights(flights) {
    if (!flightSource) {
        return
    }

    if (!Array.isArray(flights)) {
        throw new TypeError('Flights must be an array')
    }

    const newFeatures = []
    const currentIds = new Set()

    flights.forEach((flight) => {
        const existingFeature = flightSource.getFeatureById(flight.icao24)

        currentIds.add(flight.icao24)

        if (existingFeature) {
            const previousFlight = existingFeature.get('flight')

            // Update position if changed
            const newCoordinates = fromLonLat([
                flight.longitude,
                flight.latitude,
            ])

            const geometry = existingFeature.getGeometry()
            const previousCoordinates = geometry.getCoordinates()

            if (
                previousCoordinates[0] !== newCoordinates[0] ||
                previousCoordinates[1] !== newCoordinates[1]
            ) {
                geometry.setCoordinates(newCoordinates)
            }

            // Update styling if changed
            if (previousFlight.heading !== flight.heading) {
                existingFeature.setStyle(getStyle(flight))
            }

            // Update flight data
            existingFeature.set('flight', flight)
        } else {
            // Add all planes for batch update
            newFeatures.push(createFlightFeature(flight))
        }
    })

    // Add all planes
    if (newFeatures.length > 0) {
        flightSource.addFeatures(newFeatures)
    }

    // Find planes no longer in snapshot
    const removedFeatures = flightSource.getFeatures().filter(
        (feature) => !currentIds.has(feature.getId()),
    )

    // Remove flights
    if (removedFeatures.length > 0) {
        flightSource.removeFeatures(removedFeatures)
    }
}

function getStyle(flight) {
    return new Style({
        image: new Icon({
            src: '/airplane.svg',
            anchor: AIRCRAFT_ICON_ANCHOR,
            rotation: headingToRadians(flight.heading),
            scale: AIRCRAFT_ICON_SCALE,
        }),
    })
}

function headingToRadians(heading) {
    const degrees = heading ?? 0
    return (degrees * Math.PI) / 180
}
