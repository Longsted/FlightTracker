# Live Flight Tracker

Live Flight Tracker is a web application for visualizing current flight positions on an interactive map using data from the [OpenSky Network](https://opensky-network.org/).

The application consists of a Java Spring Boot backend and a JavaScript frontend. It retrieves flight data from the OpenSky Network API, processes and stores flight information, and presents it through an interactive map-based interface.

## Features

- **Live flight visualization** – Displays aircraft positions on an interactive map.
- **Flight details** – Select individual aircraft to inspect their available flight information.
- **Search** – Search for flights using flight identifiers and callsigns.
- **Filtering** – Filter flights based on available flight data, including origin country, flight status and altitude.
- **Automatic updates** – Periodically retrieves updated flight data.
- **Flight data recovery** – Handles temporary API failures and preserves previously retrieved data when fresh data is unavailable.
- **Flight status information** – Communicates the availability and freshness of flight data.

## Architecture

The project is divided into two main applications:

### Backend

The backend is built with Java 21 and Spring Boot.

It follows a layered architecture that separates responsibilities:

- **Presentation layer** – REST controllers exposing the application API.
- **Application layer** – Business logic, services, filtering and application interfaces.
- **Domain layer** – Core flight domain model.
- **Infrastructure layer** – OpenSky API integration, data storage and scheduled data retrieval.

Flight data is retrieved from OpenSky and stored in memory for access by the application.

### Frontend

The frontend is built with JavaScript and Vite.

It is responsible for presenting flight data and handling user interaction:

- Alpine.js manages reactive UI state.
- OpenLayers handles the interactive map and flight visualization.
- Bootstrap provides UI components and styling.
- The frontend communicates with the backend through its REST API.

## Technologies

| Area | Technologies |
|---|---|
| Backend | Java 21, Spring Boot, Gradle |
| Frontend | JavaScript, Alpine.js, Vite |
| Mapping | OpenLayers, OpenStreetMap |
| Styling | Bootstrap |
| Backend testing | JUnit 5, Mockito |
| Backend quality | JaCoCo, Checkstyle, SpotBugs, Spotless |
| Frontend testing | Vitest, Playwright |
| Frontend quality | ESLint, Prettier |
| CI/CD | GitHub Actions, Docker, GitHub Container Registry |

## Project structure

```text
flightTracker/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── backend/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   ├── build.gradle
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Requirements

- Java 21
- Node.js 22
- npm

An OpenSky Network account and API credentials are required for retrieving live flight data.

## Getting started

Clone the repository:

```bash
git clone <repository-url>
cd flightTracker
```

### Backend

The backend uses the following environment variables for OpenSky authentication:

```text
OPENSKY_CLIENT_ID
OPENSKY_CLIENT_SECRET
```

Set these variables in your environment before starting the application.

On Windows PowerShell:

```powershell
$env:OPENSKY_CLIENT_ID="your-client-id"
$env:OPENSKY_CLIENT_SECRET="your-client-secret"
```

Build and run the backend:

```powershell
cd backend
.\gradlew.bat clean build
.\gradlew.bat bootRun
```

The backend runs on port `8080` by default.

### Frontend

Open a separate terminal:

```bash
cd frontend
npm ci
npm run dev
```

Vite starts the frontend development server and displays the local URL in the terminal.

## Testing

The project contains automated tests across the backend and frontend.

### Backend tests

Run the complete backend build and quality checks:

```powershell
cd backend
.\gradlew.bat clean build
```

Run additional static analysis and generate a coverage report:

```powershell
.\gradlew.bat check spotbugsMain jacocoTestReport
```

### Frontend tests

Install dependencies:

```bash
cd frontend
npm ci
```

Run unit tests with Vitest:

```bash
npm run test:unit
```

Run integration tests with Playwright:

```bash
npm run test:e2e -- --project=integration
```

Run end-to-end tests:

```bash
npm run test:e2e -- --project=e2e
```

Run all frontend tests:

```bash
npm test
```

### Code quality

Backend:

```powershell
cd backend
.\gradlew.bat check
```

Frontend:

```bash
cd frontend
npm run lint
npm run format:check
npm run build
```

## CI/CD

The project uses GitHub Actions for continuous integration and delivery.

### Continuous Integration

The CI pipeline runs automatically on pushes and pull requests targeting the `main` branch.

It includes:

- Workflow linting with actionlint.
- Backend build, tests and static analysis.
- JaCoCo test coverage reporting.
- Frontend formatting and ESLint checks.
- Frontend unit and integration tests.
- Frontend production build.
- Dedicated end-to-end tests against the backend.
- Docker image builds and vulnerability scanning.

### Continuous Delivery

The CD workflow can be triggered manually through GitHub Actions.

It deploys the backend and frontend Docker images to Render using a specified commit SHA.

Container images are published to GitHub Container Registry (GHCR) when changes are pushed to `main`.

