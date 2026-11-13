import { describe, expect, it } from "vitest";
import {
  getAltitudeColor,
  headingToRadians,
} from "../../src/map/flightStyle.js";

describe("getAltitudeColor", () => {
  it("returns blue for aircraft on ground", () => {
    // Given
    const flight = { onGround: true, barometricAltitude: 5000 };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("blue");
  });

  it("returns grey when altitude is missing", () => {
    // Given
    const flight = { onGround: false, barometricAltitude: null };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("grey");
  });

  it("returns green at 0 metres", () => {
    // Given
    const flight = { onGround: false, barometricAltitude: 0 };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("rgb(34, 197, 94)");
  });

  it("returns yellow at 3000 metres", () => {
    // Given
    const flight = { onGround: false, barometricAltitude: 3000 };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("rgb(234, 179, 8)");
  });

  it("returns orange at 6000 metres", () => {
    // Given
    const flight = { onGround: false, barometricAltitude: 6000 };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("rgb(249, 115, 22)");
  });

  it("returns red at 12000 metres", () => {
    // Given
    const flight = { onGround: false, barometricAltitude: 12000 };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("rgb(239, 68, 68)");
  });

  it("returns red above 12000 metres", () => {
    // Given
    const flight = { onGround: false, barometricAltitude: 15000 };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("rgb(239, 68, 68)");
  });

  it("interpolates colours between altitude stops", () => {
    // Given
    const flight = { onGround: false, barometricAltitude: 1500 };

    // When
    const result = getAltitudeColor(flight);

    // Then
    expect(result).toBe("rgb(134, 188, 51)");
  });
});

describe("headingToRadians", () => {
  it("converts 90 degrees to PI / 2 radians", () => {
    // Given
    const heading = 90;

    // When
    const result = headingToRadians(heading);

    // Then
    expect(result).toBeCloseTo(Math.PI / 2);
  });

  it("converts 180 degrees to PI radians", () => {
    // Given
    const heading = 180;

    // When
    const result = headingToRadians(heading);

    // Then
    expect(result).toBeCloseTo(Math.PI);
  });

  it("converts 360 degrees to 2 PI radians", () => {
    // Given
    const heading = 360;

    // When
    const result = headingToRadians(heading);

    // Then
    expect(result).toBeCloseTo(2 * Math.PI);
  });

  it("defaults to 0 when heading is null", () => {
    // Given
    const heading = null;

    // When
    const result = headingToRadians(heading);

    // Then
    expect(result).toBe(0);
  });
});
