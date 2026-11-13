export function headingToRadians(heading) {
  const degrees = heading ?? 0;
  return (degrees * Math.PI) / 180;
}

export function getAltitudeColor(flight) {
  const altitude = flight.barometricAltitude;

  if (flight.onGround) {
    return "blue";
  }

  if (altitude == null) {
    return "grey";
  }

  const colorStops = [
    { altitude: 0, color: [34, 197, 94] },
    { altitude: 3000, color: [234, 179, 8] },
    { altitude: 6000, color: [249, 115, 22] },
    { altitude: 12000, color: [239, 68, 68] },
  ];

  if (altitude >= 12000) {
    return "rgb(239, 68, 68)";
  }

  for (let i = 0; i < colorStops.length - 1; i++) {
    const lower = colorStops[i];
    const upper = colorStops[i + 1];

    if (altitude >= lower.altitude && altitude < upper.altitude) {
      const factor =
        (altitude - lower.altitude) / (upper.altitude - lower.altitude);

      const rgb = lower.color.map((value, index) => {
        return Math.round(value + (upper.color[index] - value) * factor);
      });

      return `rgb(${rgb.join(", ")})`;
    }
  }

  return "rgb(34, 197, 94)";
}
