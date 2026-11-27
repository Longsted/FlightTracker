export function flightDetail(page, field) {
  return page.getByTestId(`flight-${field}`);
}

export function flightDetailsContent(page) {
  return page.locator(".details-content");
}
