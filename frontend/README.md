# Live Flight Tracker – Frontend

Frontend til Live Flight Tracker-projektet. Applikationen viser flytrafik i realtid på et interaktivt kort og giver brugeren mulighed for at interagere med og undersøge flydata.

## Teknologier

- **Vanilla JavaScript** – applikationslogik
- **Alpine.js** – reaktiv brugergrænseflade og håndtering af UI-tilstand
- **OpenLayers** – interaktivt kort og visualisering af fly
- **OpenStreetMap** – kortdata og baggrundskort
- **Bootstrap** – styling og layout
- **Vite** – udviklingsserver og buildværktøj

## Forudsætninger

- Node.js
- npm

## Kom i gang

Kør kommandoerne fra frontend-mappen:

```bash
npm install
npm run dev
```

## Kvalitetskontrol

### Formatering med Prettier

Kontrollér om filerne følger projektets formatteringsregler:

```bash
npm run format:check
```

Formatér filerne automatisk:

```bash
npm run format
```

### Linting med ESLint

Kontrollér koden for potentielle fejl og kvalitetsproblemer:

```bash
npm run lint
```

### Tests med Playwright

Kør frontendens tests:

```bash
npm test
```

Start Playwrights interaktive testværktøj:

```bash
npm run test:ui
```

### Build

Byg frontend-projektet:

```bash
npm run build
```

## CI

Frontendens kvalitetskontroller køres automatisk gennem GitHub Actions ved push og pull requests.

CI-pipelinen kontrollerer:

- Prettier-formatering
- ESLint
- Playwright-tests
- Production build
