
import { test, expect } from '@playwright/test'

// ========================================
// Shared test helpers
// ========================================

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
// Assumes the map starts centered at [10.5, 56.0] with zoom level 6.
async function clickFlightPosition(page, longitude, latitude) {
    const map = page.locator('#flight-map')

    await expect(map.locator('.ol-viewport')).toBeVisible()

    // Wait until the aircraft icon is loaded and decoded.
    await page.evaluate(async () => {
        const icon = new Image()
        icon.src = '/airplane.svg'
        await icon.decode()
    })

    const bounds = await map.boundingBox()

    const project = (lon, lat) => {
        const x = (lon * 20037508.342789244) / 180
        const latRadians = (lat * Math.PI) / 180
        const y =
            Math.log(Math.tan(Math.PI / 4 + latRadians / 2)) *
            6378137

        return [x, y]
    }

    const center = project(10.5, 56.0)
    const position = project(longitude, latitude)
    const resolution = 156543.03392804097 / 2 ** 6

    const pixelX =
        bounds.width / 2 + (position[0] - center[0]) / resolution

    const pixelY =
        bounds.height / 2 - (position[1] - center[1]) / resolution

    await page.mouse.click(
        bounds.x + pixelX,
        bounds.y + pixelY,
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
    await expect(flightDetails.locator('dd').nth(0)).toHaveText('TEST-CENTER')
    await expect(flightDetails.locator('dd').nth(1)).toHaveText('10.5')
    await expect(flightDetails.locator('dd').nth(2)).toHaveText('56')
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
    await expect(flightDetails.locator('dd').nth(1)).toHaveText('13')
    await expect(flightDetails.locator('dd').nth(2)).toHaveText('58')

    // Verify that the marker can still be selected at its new position.
    await clickFlightPosition(page, 13.0, 58.0)

    await expect(flightDetails).toBeVisible()
    await expect(flightDetails.locator('dd').nth(0)).toHaveText(
        'TEST-UPDATED',
    )
})

test('removes selected flight when it disappears from snapshot', async ({
                                                                            page,
                                                                        }) => {
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

test('continues updating flights after a failed API request', async ({
                                                                         page,
                                                                     }) => {
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
