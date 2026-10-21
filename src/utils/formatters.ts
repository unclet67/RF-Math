/**
 * Converts decimal feet into traditional Feet & Inches string (e.g. 32' 10.4")
 */
export function formatFeetAndInches(totalFeet: number): string {
  if (!isFinite(totalFeet) || totalFeet <= 0) return '0\' 0.0"';
  const wholeFeet = Math.floor(totalFeet);
  const remainingInches = (totalFeet - wholeFeet) * 12;
  if (remainingInches >= 11.95) {
    return `${wholeFeet + 1}' 0.0"`;
  }
  return `${wholeFeet}' ${remainingInches.toFixed(1)}"`;
}

/**
 * Converts meters into Meters & Centimeters or Millimeters string
 */
export function formatMetricLength(meters: number): string {
  if (!isFinite(meters) || meters <= 0) return '0.00 m';
  if (meters < 1) {
    return `${(meters * 100).toFixed(1)} cm (${(meters * 1000).toFixed(0)} mm)`;
  }
  return `${meters.toFixed(3)} m (${(meters * 100).toFixed(1)} cm)`;
}

/**
 * Converts dBm power into standard IARU S-Meter reading
 * HF (<30 MHz): S9 = -73 dBm, 6 dB per S-unit
 * VHF/UHF (>=30 MHz): S9 = -93 dBm, 6 dB per S-unit
 */
export function dBmToSMeter(dBm: number, isVhfOrHigher = false): {
  label: string;
  sUnits: number;
  overS9dB: number;
  percentScale: number;
} {
  const s9Ref = isVhfOrHigher ? -93 : -73;
  const diffFromS9 = dBm - s9Ref;

  if (diffFromS9 >= 0) {
    const over = Math.round(diffFromS9);
    const pct = Math.min(100, 65 + (diffFromS9 / 60) * 35);
    return {
      label: over === 0 ? 'S9' : `S9 +${over} dB`,
      sUnits: 9,
      overS9dB: over,
      percentScale: pct,
    };
  }

  // Below S9: each S-unit is 6 dB
  const exactS = 9 + diffFromS9 / 6;
  const clampedS = Math.max(0, exactS);
  const roundedS = Math.max(1, Math.min(9, Math.round(clampedS)));
  const pct = Math.max(2, (clampedS / 9) * 65);

  if (exactS < 1) {
    return {
      label: `< S1 (${dBm.toFixed(0)} dBm)`,
      sUnits: 0,
      overS9dB: 0,
      percentScale: pct,
    };
  }

  return {
    label: `S${roundedS} (${exactS.toFixed(1)})`,
    sUnits: roundedS,
    overS9dB: 0,
    percentScale: pct,
  };
}
