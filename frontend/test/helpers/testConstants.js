export const API_ENDPOINTS = {
  SEARCH: "**/api/flights/search**",
  FILTER: "**/api/flights/filter**",
  FLIGHTS: "**/api/flights",
  FLIGHT_STATUS: "**/api/flights/status**",
};
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
};
export const TEST_COUNTRIES = {
  DENMARK: "Denmark",
  GERMANY: "Germany",
};

export const TEST_FLIGHTS = {
  SAS: {
    callsign: "SAS123",
    icao24: "abc123",
  },
  LUFTHANSA: {
    callsign: "DLH456",
    icao24: "def456",
  },
  BRITISH_AIRWAYS: {
    callsign: "BAW789",
    icao24: "ghi789",
  },
};
