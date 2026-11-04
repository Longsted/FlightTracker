# Live Flight Tracker

A web application for visualizing current flight positions on an interactive map using data from the OpenSky Network API.

The project consists of a Java Spring Boot backend and a JavaScript frontend. The architecture separates external API integration from application logic to support automated testing and maintainability.

## Project structure

- `backend/` – Java Spring Boot application and backend tests.
- `frontend/` – JavaScript frontend built with Vite.
- `.github/workflows/` – GitHub Actions CI pipeline.

## Technologies

**Backend**
- Java 21
- Spring Boot
- Gradle
- JUnit 5 and Mockito
- JaCoCo
- Checkstyle, SpotBugs and Spotless

**Frontend**
- JavaScript
- Alpine.js
- OpenLayers
- Bootstrap
- Vite
- ESLint

**CI/CD**
- GitHub Actions

## Requirements

- Java 21
- Node.js 22
- npm

## Getting started

Clone the repository and open a terminal in the project root.

### Backend

Run the backend tests and build:

```powershell
cd backend
.\gradlew.bat clean build
```

Start the backend:

```powershell
.\gradlew.bat bootRun
```

### Frontend

Open a separate terminal in the project root:

```powershell
cd frontend
npm ci
npm run dev
```

The frontend development server will display its local URL in the terminal.

## Quality checks

### Backend

```powershell
cd backend
.\gradlew.bat check
```

### Frontend

```powershell
cd frontend
npm run lint
npm run build
```

## Continuous Integration

GitHub Actions automatically builds and checks the backend and frontend when code is pushed or a pull request is created targeting `main`.

The backend pipeline runs automated tests and code quality checks and generates a JaCoCo coverage report. The frontend pipeline runs ESLint and builds the application.
