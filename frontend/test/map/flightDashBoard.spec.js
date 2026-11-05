
import { test, expect } from '@playwright/test'

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

// Mocks the flight API with controlled data and HTTP status.
async function mockFlightApi(page, { status = 200, flights = [] } = {}) {
    await page.route('**/api/flights', async (route) => { // ** to avoid writing localhost and portnumbers
        await route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(
                status === 200 ? flights : { error: 'Internal Server Error' },
            ),
        })
    })
}

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

    const map = page.locator('#flight-map')
    const bounds = await map.boundingBox()

    await page.mouse.click(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
    )

    const flightDetails = page.locator('dl')

    await expect(flightDetails).toBeVisible()
    await expect(flightDetails.locator('dd').nth(0)).toHaveText('TEST-CENTER')
    await expect(flightDetails.locator('dd').nth(1)).toHaveText('10.5')
    await expect(flightDetails.locator('dd').nth(2)).toHaveText('56')
})
