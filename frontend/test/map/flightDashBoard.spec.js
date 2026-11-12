import { test, expect } from '@playwright/test'

// ========================================
// before each
// ========================================

test.beforeEach(async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', route => {
        return route.fulfill({
            status: 200,
            contentType: 'image/svg+xml',
            body: `
                <svg xmlns="http://www.w3.org/2000/svg"
                     width="1" height="1">
                    <rect width="1" height="1" fill="transparent"/>
                </svg>
            `,
        })
    })
})


// ========================================
// Shared test helpers
// ========================================

async function getFlightMarkerSvg(page, icao24) {
    return page.evaluate((icao24) => {
        const map = window.__OL_MAP__
        const flightLayer = map.getLayers().item(1)
        const feature = flightLayer
            .getSource()
            .getFeatureById(icao24)

        const src = feature.getStyle().getImage().getSrc()

        return decodeURIComponent(src.split(',')[1])
    }, icao24)
}

async function waitForMapRender(page) {
    await page.evaluate(() => {
        const map = window.__OL_MAP__

        return new Promise((resolve) => {
            map.once('rendercomplete', resolve)
            map.renderSync()
        })
    })
}

function flightDetail(page, field) {
    return page.getByTestId(`flight-${field}`)
}

// Creates a flight with default test data.
// Individual properties can be overridden when needed.
function createFlight(overrides = {}) {
    return {
        icao24: 'abc123',
        callsign: 'TEST123',
        originCountry: 'Denmark',
        timePosition: 1730000000,
        lastContact: 1730000000,
        longitude: 12.5683,
        latitude: 55.6761,
        barometricAltitude: 10000,
        onGround: false,
        velocity: 250,
        heading: 180,
        verticalRate: 0,
        ...overrides,
    }
}

// Mocks the flight API with controlled snapshots and HTTP status.
// Each snapshot can be an array of flights or an object containing
// a status and flights property.
async function mockFlightApi(
    page,
    { status = 200, flights = [], snapshots } = {},
) {
    let requestCount = 0

    await page.route('**/api/flights', async (route) => {
        const snapshot = snapshots
            ? snapshots[Math.min(requestCount, snapshots.length - 1)]
            : { status, flights }

        requestCount++

        const currentStatus = Array.isArray(snapshot)
            ? 200
            : snapshot.status ?? 200

        const currentFlights = Array.isArray(snapshot)
            ? snapshot
            : snapshot.flights ?? []

        await route.fulfill({
            status: currentStatus,
            contentType: 'application/json',
            body: JSON.stringify(
                currentStatus === 200
                    ? currentFlights
                    : { error: 'Internal Server Error' },
            ),
        })
    })

    return () => requestCount
}

// Clicks a flight at its geographic position.
async function clickFlightPosition(page, longitude, latitude) {
    const mapElement = page.locator('#flight-map')

    await expect(mapElement.locator('.ol-viewport')).toBeVisible()
    await waitForMapRender(page)

    const pixel = await page.evaluate(([longitude, latitude]) => {
        const map = window.__OL_MAP__
        const coordinate = window.__OL_FROM_LON_LAT__([
            longitude,
            latitude,
        ])

        return map.getPixelFromCoordinate(coordinate)
    }, [longitude, latitude])

    const bounds = await mapElement.boundingBox()

    await page.mouse.click(
        bounds.x + pixel[0],
        bounds.y + pixel[1],
    )
}

// ========================================
// US1 - Display flight data on map
// ========================================

test('displays flight data received from API', async ({ page }) => {
    const flights = [
        createFlight(),
        createFlight({
            icao24: 'def456',
            callsign: 'TEST456',
            originCountry: 'Germany',
            longitude: 13.405,
            latitude: 52.52,
            barometricAltitude: 11000,
            velocity: 230,
            heading: 90,
        }),
    ]

    await mockFlightApi(page, { flights })
    await page.goto('/')

    await expect(page.locator('header p')).toHaveText('Showing 2 flights')
    await expect(page.locator('#flight-map')).toBeVisible()
})

test('displays message when no flights are available', async ({ page }) => {
    await mockFlightApi(page)
    await page.goto('/')

    await expect(page.locator('header p')).toHaveText(
        'No flights currently available',
    )
    await expect(page.locator('#flight-map')).toBeVisible()
})

test('displays error message when API returns HTTP 500', async ({ page }) => {
    await mockFlightApi(page, { status: 500 })
    await page.goto('/')

    await expect(page.locator('header p')).toHaveText(
        'Could not retrieve flight data',
    )
    await expect(page.locator('#flight-map')).toBeVisible()
})

test('displays flight marker at its geographic position', async ({ page }) => {
    const flight = createFlight({
        callsign: 'TEST-CENTER',
        longitude: 10.5,
        latitude: 56.0,
    })

    await mockFlightApi(page, { flights: [flight] })
    await page.goto('/')

    await expect(page.locator('header p')).toHaveText('Showing 1 flights')

    await clickFlightPosition(page, 10.5, 56.0)

    const flightDetails = page.locator('dl')

    await expect(flightDetails).toBeVisible()

    const details = flightDetails.locator('dd')

    await expect(details.nth(0)).toHaveText('TEST-CENTER')
    await expect(details.nth(1)).toHaveText('abc123')
    await expect(details.nth(2)).toHaveText('Denmark')
    await expect(details.nth(3)).toHaveText('In flight')
    await expect(details.nth(4)).toHaveText('10000 m')
    await expect(details.nth(5)).toHaveText('250 m/s')
    await expect(details.nth(6)).toHaveText('180°')
    await expect(details.nth(7)).toHaveText('0 m/s')
    await expect(details.nth(8)).toHaveText('10.5')
    await expect(details.nth(9)).toHaveText('56')
})

// ========================================
// US2 - Update flight positions
// ========================================

test('updates flight position and keeps map interactive', async ({ page }) => {
    const initialFlight = createFlight({
        callsign: 'TEST-CENTER',
        longitude: 10.5,
        latitude: 56.0,
    })

    const updatedFlight = createFlight({
        callsign: 'TEST-UPDATED',
        longitude: 13.0,
        latitude: 58.0,
    })

    await page.clock.install()

    const getRequestCount = await mockFlightApi(page, {
        snapshots: [[initialFlight], [updatedFlight]],
    })

    await page.goto('/')

    await expect(page.locator('header p')).toHaveText('Showing 1 flights')
    await expect.poll(getRequestCount).toBe(1)

    // Select the flight before the update.
    await clickFlightPosition(page, 10.5, 56.0)

    const flightDetails = page.locator('dl')

    await expect(flightDetails).toBeVisible()
    await expect(flightDetails.locator('dd').nth(0)).toHaveText('TEST-CENTER')

    // Advance the clock by the 120-second polling interval.
    await page.clock.fastForward(120_000)

    await expect.poll(getRequestCount).toBe(2)

    // Verify that the selected flight details have been updated.
    await expect(flightDetails.locator('dd').nth(0)).toHaveText(
        'TEST-UPDATED',
    )
    await expect(flightDetails.locator('dd').nth(8)).toHaveText('13')
    await expect(flightDetails.locator('dd').nth(9)).toHaveText('58')

    // Verify that the marker can still be selected at its new position.
    await clickFlightPosition(page, 13.0, 58.0)

    await expect(flightDetails).toBeVisible()
    await expect(flightDetails.locator('dd').nth(0)).toHaveText(
        'TEST-UPDATED',
    )
})

test('removes selected flight when it disappears from snapshot', async ({ page }) => {
    const flight = createFlight({
        callsign: 'TEST-CENTER',
        longitude: 10.5,
        latitude: 56.0,
    })

    await page.clock.install()

    const getRequestCount = await mockFlightApi(page, {
        snapshots: [[flight], []],
    })

    await page.goto('/')

    await expect(page.locator('header p')).toHaveText('Showing 1 flights')
    await expect.poll(getRequestCount).toBe(1)

    await clickFlightPosition(page, 10.5, 56.0)

    const flightDetails = page.locator('dl')

    await expect(flightDetails).toBeVisible()

    // The next snapshot no longer contains the flight.
    await page.clock.fastForward(120_000)

    await expect.poll(getRequestCount).toBe(2)

    await expect(page.locator('header p')).toHaveText(
        'No flights currently available',
    )
    await expect(flightDetails).toBeHidden()

    // The removed marker should no longer be selectable.
    await clickFlightPosition(page, 10.5, 56.0)

    await expect(flightDetails).toBeHidden()
})

test('continues updating flights after a failed API request', async ({ page }) => {
    const initialFlight = createFlight({
        callsign: 'TEST-INITIAL',
        longitude: 10.5,
        latitude: 56.0,
    })

    const updatedFlight = createFlight({
        callsign: 'TEST-UPDATED',
        longitude: 13.0,
        latitude: 58.0,
    })

    await page.clock.install()

    const getRequestCount = await mockFlightApi(page, {
        snapshots: [
            [initialFlight],
            { status: 500 },
            [updatedFlight],
        ],
    })

    await page.goto('/')

    await expect(page.locator('header p')).toHaveText('Showing 1 flights')
    await expect.poll(getRequestCount).toBe(1)

    // The second request fails.
    await page.clock.fastForward(120_000)

    await expect.poll(getRequestCount).toBe(2)

    await expect(page.locator('header p')).toHaveText(
        'Could not retrieve flight data',
    )

    // The existing marker should still be interactive after the error.
    await clickFlightPosition(page, 10.5, 56.0)

    const flightDetails = page.locator('dl')

    await expect(flightDetails).toBeVisible()
    await expect(flightDetails.locator('dd').nth(0)).toHaveText(
        'TEST-INITIAL',
    )

    // The third request succeeds.
    await page.clock.fastForward(120_000)

    await expect.poll(getRequestCount).toBe(3)

    await expect(page.locator('header p')).toHaveText('Showing 1 flights')

    // The new marker should be interactive at its updated position.
    await clickFlightPosition(page, 13.0, 58.0)

    await expect(flightDetails).toBeVisible()
    await expect(flightDetails.locator('dd').nth(0)).toHaveText(
        'TEST-UPDATED',
    )
})

// ========================================
// US3 - Selected flight details
// ========================================

test('updates flight details when selecting another flight', async ({ page }) => {
    const firstFlight = createFlight({
        icao24: 'abc123',
        callsign: 'FIRST123',
        longitude: 10.5,
        latitude: 56.0,
    })

    const secondFlight = createFlight({
        icao24: 'def456',
        callsign: 'SECOND456',
        longitude: 13.0,
        latitude: 58.0,
    })

    await mockFlightApi(page, {
        flights: [firstFlight, secondFlight],
    })

    await page.goto('/')

    await clickFlightPosition(page, 10.5, 56.0)

    const flightDetails = page.locator('dl')
    const details = flightDetails.locator('dd')

    await expect(details.nth(0)).toHaveText('FIRST123')

    await clickFlightPosition(page, 13.0, 58.0)

    await expect(details.nth(0)).toHaveText('SECOND456')
    await expect(details.nth(1)).toHaveText('def456')
})

test('displays unavailable for missing flight details', async ({ page }) => {
    const flight = createFlight({
        longitude: 10.5,
        latitude: 56.0,
        callsign: null,
        originCountry: null,
        barometricAltitude: null,
        velocity: null,
        heading: null,
        verticalRate: null,
    })

    await mockFlightApi(page, { flights: [flight] })
    await page.goto('/')

    await clickFlightPosition(page, 10.5, 56.0)

    const details = page.locator('dl').locator('dd')

    await expect(details.nth(0)).toHaveText('Unavailable')
    await expect(details.nth(2)).toHaveText('Unavailable')
    await expect(details.nth(4)).toHaveText('Unavailable')
    await expect(details.nth(5)).toHaveText('Unavailable')
    await expect(details.nth(6)).toHaveText('Unavailable')
    await expect(details.nth(7)).toHaveText('Unavailable')
})

test('keeps flight selectable when altitude is missing', async ({ page }) => {
    const flight = createFlight({
        longitude: 10.5,
        latitude: 56.0,
        barometricAltitude: null,
    })

    await mockFlightApi(page, { flights: [flight] })
    await page.goto('/')

    await clickFlightPosition(page, 10.5, 56.0)

    await expect(page.locator('dl')).toBeVisible()
    await expect(flightDetail(page, 'callsign')).toHaveText('TEST123')
    await expect(flightDetail(page, 'altitude')).toHaveText('Unavailable')
})


test('displays available details when some flight data is missing', async ({ page }) => {
    const flight = createFlight({
        longitude: 10.5,
        latitude: 56.0,
        barometricAltitude: null,
        velocity: null,
    })

    await mockFlightApi(page, { flights: [flight] })
    await page.goto('/')

    await clickFlightPosition(page, 10.5, 56.0)

    await expect(flightDetail(page, 'callsign')).toHaveText('TEST123')
    await expect(flightDetail(page, 'icao24')).toHaveText('abc123')
    await expect(flightDetail(page, 'altitude')).toHaveText('Unavailable')
    await expect(flightDetail(page, 'ground-speed')).toHaveText('Unavailable')
    await expect(flightDetail(page, 'track')).toHaveText('180°')
    await expect(flightDetail(page, 'vertical-speed')).toHaveText('0 m/s')
})

test('preserves map view when flights are updated', async ({ page }) => {
    const initialFlight = createFlight()
    const updatedFlight = createFlight({
        longitude: 13.0,
        latitude: 58.0,
    })

    await page.clock.install()

    const getRequestCount = await mockFlightApi(page, {
        snapshots: [[initialFlight], [updatedFlight]],
    })

    await page.goto('/')

    await expect.poll(getRequestCount).toBe(1)

    // Pan and zoom the map.
    const initialView = await page.evaluate(() => {
        const map = window.__OL_MAP__
        const view = map.getView()

        view.setCenter(
            window.__OL_FROM_LON_LAT__([8.0, 54.0]),
        )
        view.setZoom(8)

        return {
            center: view.getCenter(),
            zoom: view.getZoom(),
        }
    })

    await waitForMapRender(page)

    // Trigger the next flight update.
    await page.clock.fastForward(120_000)
    await expect.poll(getRequestCount).toBe(2)

    await waitForMapRender(page)

    // Verify that the map view was preserved.
    const updatedView = await page.evaluate(() => {
        const view = window.__OL_MAP__.getView()

        return {
            center: view.getCenter(),
            zoom: view.getZoom(),
        }
    })

    expect(updatedView.center).toEqual(initialView.center)
    expect(updatedView.zoom).toBe(initialView.zoom)
})
test('deselects flight when clicking empty map area', async ({ page }) => {
    const flight = createFlight({
        longitude: 10.5,
        latitude: 56.0,
    })

    await mockFlightApi(page, { flights: [flight] })
    await page.goto('/')

    await clickFlightPosition(page, 10.5, 56.0)

    const flightDetails = page.locator('dl')

    await expect(flightDetails).toBeVisible()

    // Click an empty area away from the selected marker.
    const bounds = await page.locator('#flight-map').boundingBox()

    await page.mouse.click(
        bounds.x + bounds.width / 2 + 100,
        bounds.y + bounds.height / 2 + 100,
    )

    await expect(flightDetails).toBeHidden()
})
test('displays marker colors according to altitude', async ({ page }) => {
    const flights = [
        createFlight({
            icao24: 'ground',
            onGround: true,
            barometricAltitude: 1000,
        }),
        createFlight({
            icao24: 'unknown',
            barometricAltitude: null,
        }),
        createFlight({
            icao24: 'low',
            barometricAltitude: 1000,
        }),
        createFlight({
            icao24: 'medium',
            barometricAltitude: 4000,
        }),
        createFlight({
            icao24: 'high',
            barometricAltitude: 9000,
        }),
        createFlight({
            icao24: 'very-high',
            barometricAltitude: 13000,
        }),
    ]

    await mockFlightApi(page, { flights })
    await page.goto('/')

    const expectedColors = [
        ['ground', 'blue'],
        ['unknown', 'grey'],
        ['low', 'rgb(101, 191, 65)'],
        ['medium', 'rgb(239, 158, 13)'],
        ['high', 'rgb(244, 92, 45)'],
        ['very-high', 'rgb(239, 68, 68)'],
    ]

    for (const [icao24, color] of expectedColors) {
        const svg = await getFlightMarkerSvg(page, icao24)

        expect(svg).toContain(`fill="${color}"`)
    }
})
test('updates marker color when altitude changes', async ({ page }) => {
    const initialFlight = createFlight({
        barometricAltitude: 1000,
    })

    const updatedFlight = createFlight({
        barometricAltitude: 9000,
    })

    await page.clock.install()

    const getRequestCount = await mockFlightApi(page, {
        snapshots: [[initialFlight], [updatedFlight]],
    })

    await page.goto('/')

    await expect.poll(getRequestCount).toBe(1)

    const initialSvg = await getFlightMarkerSvg(page, 'abc123')
    expect(initialSvg).toContain('fill="rgb(101, 191, 65)"')

    // Trigger the next flight update.
    await page.clock.fastForward(120_000)

    await expect.poll(async () => {
        const svg = await getFlightMarkerSvg(page, 'abc123')
        return svg.includes('fill="rgb(244, 92, 45)"')
    }).toBe(true)
})
test('displays altitude legend on the flight map', async ({ page }) => {
    await mockFlightApi(page, { flights: [] })

    await page.goto('/')

    const legend = page.locator('.altitude-legend')

    await expect(legend).toBeVisible()
    await expect(legend).toContainText('Flight altitude')
    await expect(legend).toContainText('0 m')
    await expect(legend).toContainText('3.000 m')
    await expect(legend).toContainText('6.000 m')
    await expect(legend).toContainText('12.000 m+')
    await expect(legend).toContainText('On ground')
    await expect(legend).toContainText('Unknown altitude')
})