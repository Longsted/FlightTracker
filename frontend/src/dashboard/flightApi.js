const API_BASE_URL = "/api/flights";

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(
      `HTTP error: ${response.status}${response.url ? ` on ${response.url}` : ""}`,
    );
  }

  return response.json();
}

export async function getFlights() {
  const response = await fetch(API_BASE_URL);
  return handleResponse(response);
}

export async function searchFlights(query) {
  const params = new URLSearchParams({ query });

  const response = await fetch(`${API_BASE_URL}/search?${params}`);
  return handleResponse(response);
}

export async function getFlightStatus() {
  const response = await fetch(`${API_BASE_URL}/status`);
  return handleResponse(response);
}

export async function filterFlights(filters, signal) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      params.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/filter?${params}`, {
    signal,
  });

  return handleResponse(response);
}
