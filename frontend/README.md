# Live Flight Tracker – Frontend

The frontend is the user-facing part of the Live Flight Tracker application. It provides an interactive map for visualizing live flight positions and allows users to search, filter and inspect flight information.

The frontend communicates with the Spring Boot backend through its REST API.

## Technologies

| Technology         | Purpose                                  |
| ------------------ | ---------------------------------------- |
| Vanilla JavaScript | Application logic                        |
| Alpine.js          | Reactive UI state and user interaction   |
| OpenLayers         | Interactive map and flight visualization |
| OpenStreetMap      | Map tiles and background map             |
| Bootstrap          | UI components and styling                |
| Vite               | Development server and build tool        |

## Features

- **Interactive flight map** – Displays aircraft positions on an interactive map.
- **Flight details** – Select aircraft to inspect their available information.
- **Flight search** – Search for flights using callsigns and flight identifiers.
- **Flight filtering** – Filter flights based on available flight attributes.
- **Automatic updates** – Displays updated flight information retrieved from the backend.
- **Flight data status** – Communicates when flight data is unavailable or outdated.

## Requirements

- Node.js
- npm
- A running instance of the backend for local development.

## Getting started

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite starts the development server, normally available at:

```text
http://localhost:5173
```

The frontend uses Vite's development proxy to forward `/api` requests to the backend at `http://localhost:8080`.

Make sure the backend is running before using the application.

## Testing

The frontend uses Vitest for unit testing and Playwright for integration and end-to-end testing.

### Unit tests

Unit tests cover individual frontend components and application logic.

Run all unit tests:

```bash
npm run test:unit
```

### Integration tests

Integration tests use Playwright to test interactions between frontend components and mocked API responses.

Run integration tests:

```bash
npx playwright test --project=integration
```

### End-to-end tests

End-to-end tests verify application behaviour through the browser while communicating with the backend.

Run end-to-end tests:

```bash
npx playwright test --project=e2e
```

Playwright automatically starts the backend using its E2E configuration and starts the Vite development server.

### Run all tests

```bash
npm test
```

This runs the unit tests followed by all Playwright tests.

### Playwright UI

Start Playwright's interactive test interface:

```bash
npm run test:ui
```

## Code quality

The frontend uses ESLint and Prettier to maintain code quality and consistent formatting.

### ESLint

```bash
npm run lint
```

### Prettier

Check formatting:

```bash
npm run format:check
```

Format files:

```bash
npm run format
```

## Production build

Create an optimized production build:

```bash
npm run build
```

The generated production files are placed in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```
