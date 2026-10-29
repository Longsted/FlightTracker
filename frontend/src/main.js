import Alpine from 'alpinejs'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'ol/ol.css'
import './index.css'
import { createFlightMap } from './map/FlightMap.js'

document.querySelector('#app').innerHTML = `
  <div class="container-fluid" x-data="flightDashboard">
    <header class="py-3 border-bottom">
      <h1 class="h3 mb-0">Live Flight Tracker</h1>
      <p class="text-body-secondary mb-0 mt-2" x-text="statusMessage"></p>
    </header>

    <main class="py-4">
      <div class="row g-3">
        <section class="col-12 col-lg-8">
          <div class="card">
            <div class="card-body">
              <h2 class="h5">Flight map</h2>
              <div
                id="flight-map"
                class="flight-map"
                aria-label="Map showing sample flight positions"
              ></div>
            </div>
          </div>
        </section>

        <aside class="col-12 col-lg-4">
          <div class="card">
            <div class="card-body">
              <h2 class="h5">Flight details</h2>

              <p x-show="!selectedFlight" class="text-body-secondary">
                Select a flight to view its details.
              </p>

              <dl x-cloak x-show="selectedFlight">
                <dt>Callsign</dt>
                <dd x-text="selectedFlight?.callsign"></dd>
                <dt>Longitude</dt>
                <dd x-text="selectedFlight?.longitude"></dd>
                <dt>Latitude</dt>
                <dd x-text="selectedFlight?.latitude"></dd>
              </dl>
            </div>
          </aside>
        </section>
      </div>
    </main>
  </div>
`

Alpine.data('flightDashboard', () => ({
  statusMessage: 'Viser eksempelpositioner',
  selectedFlight: null,

  init() {
    window.addEventListener('asset-clicked', (event) => {
      this.selectedFlight = event.detail
    })
  },
}))

window.Alpine = Alpine
Alpine.start()

requestAnimationFrame(() => {
  createFlightMap()
})