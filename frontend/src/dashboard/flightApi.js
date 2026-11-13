const API_BASE_URL = "/api/flights";

export async function getFlights() {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

export async function searchFlights(query) {
  const params = new URLSearchParams({ query });

  const response = await fetch(`${API_BASE_URL}/search?${params}`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}
