import Alpine from 'alpinejs'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'ol/ol.css'
import './index.css'
import {createFlightMap, updateFlights} from './map/flightMap.js'

document.querySelector('#app').innerHTML = `
  <div class="container-fluid" x-data="flightDashboard">
    <header class="py-3 border-bottom">
      <h1 class="h3 mb-0">Live Flight Tracker</h1>
      <p class="text-body-secondary mb-0 mt-2" x-text="statusMessage"></p>
    </header>

    <main class="py-4">
      <div class="row">
        <section class="col-12">
          <div class="card">
            <div class="card-body">
              <h2 class="h5">Flight map</h2>
              <div class="map-container">
    <div
        id="flight-map"
        class="flight-map"
        aria-label="Map showing current flight positions"
    ></div>

    <div class="altitude-legend">
        <h3>Flight altitude</h3>

        <div class="altitude-gradient"></div>

        <div class="altitude-labels">
            <span>0 m</span>
            <span>3.000 m</span>
            <span>6.000 m</span>
            <span>12.000 m+</span>
        </div>

        <div class="altitude-special">
            <span><i class="legend-color ground"></i> On ground</span>
            <span><i class="legend-color unknown"></i> Unknown altitude</span>
        </div>
        </div> <!-- altitude-legend -->
       
                <aside class="flight-panel"
                        x-cloak
                        x-show="flightPanelOpen">
          <div class="card">
            <div class="card-body">
              <h2 class="h5">Flight details</h2>

              <p x-show="!selectedFlight" class="text-body-secondary">
                Select a flight to view its details.
              </p>

             <dl x-cloak x-show="selectedFlight">

    <!-- Aircraft information -->
    <h3 class="mt-3">Aircraft information</h3>

    <dt>Callsign</dt>
    <dd data-testid="flight-callsign"
        x-text="selectedFlight?.callsign || 'Unavailable'"></dd>

    <dt>ICAO24</dt>
    <dd data-testid="flight-icao24"
        x-text="selectedFlight?.icao24 || 'Unavailable'"></dd>

    <dt>Origin country</dt>
    <dd data-testid="flight-origin-country"
        x-text="selectedFlight?.originCountry || 'Unavailable'"></dd>

    <!-- Flight conditions -->
    <h3 class="mt-3">Flight conditions</h3>

    <dt>Status</dt>
    <dd data-testid="flight-status"
        x-text="selectedFlight?.onGround ? 'On ground' : 'In flight'"></dd>

    <dt>Altitude</dt>
    <dd data-testid="flight-altitude"
        x-text="selectedFlight?.barometricAltitude != null
            ? selectedFlight.barometricAltitude + ' m'
            : 'Unavailable'"></dd>

    <dt>Ground speed</dt>
    <dd data-testid="flight-ground-speed"
        x-text="selectedFlight?.velocity != null
            ? selectedFlight.velocity + ' m/s'
            : 'Unavailable'"></dd>

    <dt>Track</dt>
    <dd data-testid="flight-track"
        x-text="selectedFlight?.heading != null
            ? selectedFlight.heading + '°'
            : 'Unavailable'"></dd>

    <dt>Vertical speed</dt>
    <dd data-testid="flight-vertical-speed"
        x-text="selectedFlight?.verticalRate != null
            ? selectedFlight.verticalRate + ' m/s'
            : 'Unavailable'"></dd>

    <!-- Position -->
    <h3 class="mt-3">Position</h3>

    <dt>Longitude</dt>
    <dd data-testid="flight-longitude"
        x-text="selectedFlight?.longitude ?? 'Unavailable'"></dd>

    <dt>Latitude</dt>
    <dd data-testid="flight-latitude"
        x-text="selectedFlight?.latitude ?? 'Unavailable'"></dd>

</dl>
            </div>
          </aside>
          <button 
          type="button"
          class="flight-panel-toggle"
          :class="{ 'panel-open': flightPanelOpen}"
          @click="flightPanelOpen = !flightPanelOpen"
          :aria-expanded="flightPanelOpen"
          aria-label="Toggle flight details">
          <span x-text="flightPanelOpen ? '>' : '<'"></span>
</button>
    </div>
</div>
             
            </div>
          </div>
        </section>


      </div>
    </main>
  </div>
`

Alpine.data('flightDashboard', () => ({
    statusMessage: 'Retrieving flight data',
    selectedFlight: null,
    mapInitialized: false,
    flightPanelOpen: false,

    async init() {
        window.addEventListener('asset-clicked', (event) => {
            this.selectedFlight = event.detail
            this.flightPanelOpen = true
        })
        await this.refreshFlights()

        //polling
        setInterval(() => {
            this.refreshFlights()
        }, 120000)
    },
    async refreshFlights() {
        try {
            const response = await fetch('/api/flights')

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`)
            }

            const flights = await response.json()

            if (!this.mapInitialized) {
                createFlightMap(flights)
                this.mapInitialized = true
            } else {
                updateFlights(flights)
            }

            if(this.selectedFlight){
                const updatedFlight = flights.find(
                    flight => flight.icao24 === this.selectedFlight.icao24
                )
                this.selectedFlight = updatedFlight ?? null
            }

            if (flights.length === 0) {
                this.statusMessage = 'No flights currently available'
            } else {
                this.statusMessage = `Showing ${flights.length} flights`
            }
        } catch (error) {
            console.error(`Failed to retrieve flights`, error)
            this.statusMessage = 'Could not retrieve flight data'
        }

    }
}))

window.Alpine = Alpine
Alpine.start()
