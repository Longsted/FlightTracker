
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFlightMap } from '../../src/map/flightMap.js'

const mocks = vi.hoisted(() => ({
    mapConstructor: vi.fn(),
    vectorSourceConstructor: vi.fn(),
    vectorLayerConstructor: vi.fn(),
    featureConstructor: vi.fn(),
    pointConstructor: vi.fn(),
    fromLonLat: vi.fn((coordinates) => coordinates),
    mapOn: vi.fn(),
    forEachFeatureAtPixel: vi.fn(),
    setFeature: vi.fn(),
    setFeatureStyle: vi.fn(),
}))

vi.mock('ol/Map', () => ({
    default: class {
        constructor(options) {
            mocks.mapConstructor(options)
        }

        on(...args) {
            mocks.mapOn(...args)
        }

        forEachFeatureAtPixel(...args) {
            return mocks.forEachFeatureAtPixel(...args)
        }
    },
}))

vi.mock('ol/View', () => ({
    default: class {
        constructor(options) {
            this.options = options
        }
    },
}))

vi.mock('ol/layer/Tile', () => ({
    default: class {
        constructor(options) {
            this.options = options
        }
    },
}))

vi.mock('ol/layer/Vector', () => ({
    default: class {
        constructor(options) {
            mocks.vectorLayerConstructor(options)
        }
    },
}))

vi.mock('ol/source/OSM', () => ({
    default: class {},
}))

vi.mock('ol/source/Vector', () => ({
    default: class {
        constructor(options) {
            mocks.vectorSourceConstructor(options)
        }
    },
}))

vi.mock('ol/Feature', () => ({
    default: class {
        constructor(options) {
            mocks.featureConstructor(options)
        }

        set(key, value) {
            mocks.setFeature(key, value)
        }

        setStyle(style) {
            mocks.setFeatureStyle(style)
        }

        get(key) {
            if (key === 'flight') return mocks.setFeature.mock.calls[0]?.[1]
        }
    },
}))

vi.mock('ol/geom/Point', () => ({
    default: class {
        constructor(coordinates) {
            mocks.pointConstructor(coordinates)
        }
    },
}))

vi.mock('ol/proj', () => ({
    fromLonLat: mocks.fromLonLat,
}))

vi.mock('ol/style', () => ({
    Circle: class {},
    Fill: class {},
    Stroke: class {},
    Style: class {},
}))

describe('createFlightMap', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        document.body.innerHTML = '<div id="flight-map"></div>'
    })

    it('creates a map with the provided flights', () => {
        const flights = [
            {
                callsign: 'SAS123',
                longitude: 10.7522,
                latitude: 56.2639,
            },
        ]

        createFlightMap(flights)

        expect(mocks.mapConstructor).toHaveBeenCalledOnce()
        expect(mocks.vectorSourceConstructor).toHaveBeenCalledOnce()
        expect(mocks.featureConstructor).toHaveBeenCalledOnce()
    })

    it('creates a map when the flight list is empty', () => {
        createFlightMap([])

        expect(mocks.mapConstructor).toHaveBeenCalledOnce()
        expect(mocks.vectorSourceConstructor).toHaveBeenCalledWith({
            features: [],
        })
        expect(mocks.featureConstructor).not.toHaveBeenCalled()
    })

    it('converts flight coordinates before creating map markers', () => {
        const flights = [
            {
                callsign: 'SAS123',
                longitude: 10.7522,
                latitude: 56.2639,
            },
        ]

        createFlightMap(flights)

        expect(mocks.fromLonLat).toHaveBeenCalledWith([
            10.7522,
            56.2639,
        ])
        expect(mocks.pointConstructor).toHaveBeenCalledOnce()
    })

    it('registers a click listener on the map', () => {
        createFlightMap([])

        expect(mocks.mapOn).toHaveBeenCalledWith(
            'singleclick',
            expect.any(Function),
        )
    })
})
