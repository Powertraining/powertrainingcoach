export const UNIT_SYSTEMS = Object.freeze({
  METRIC: "metric",
  IMPERIAL: "imperial",
});

const KG_TO_LB = 2.2046226218;
const METERS_TO_YARDS = 1.0936132983;
const KM_TO_MILES = 0.6213711922;
const CM_TO_INCHES = 0.3937007874;
const KPH_TO_MPH = 0.6213711922;

function parseMeasurementNumber(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeUnitSystem(value) {
  return value === UNIT_SYSTEMS.IMPERIAL
    ? UNIT_SYSTEMS.IMPERIAL
    : UNIT_SYSTEMS.METRIC;
}

export function isImperialUnitSystem(value) {
  return normalizeUnitSystem(value) === UNIT_SYSTEMS.IMPERIAL;
}

export function roundMeasurement(value, decimals = 1) {
  const parsed = parseMeasurementNumber(value);

  if (parsed == null) {
    return null;
  }

  const factor = 10 ** decimals;
  return Math.round((parsed + Number.EPSILON) * factor) / factor;
}

export function kilogramsToPounds(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed * KG_TO_LB;
}

export function poundsToKilograms(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed / KG_TO_LB;
}

export function metersToYards(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed * METERS_TO_YARDS;
}

export function yardsToMeters(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed / METERS_TO_YARDS;
}

export function kilometersToMiles(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed * KM_TO_MILES;
}

export function milesToKilometers(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed / KM_TO_MILES;
}

export function centimetersToInches(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed * CM_TO_INCHES;
}

export function inchesToCentimeters(value) {
  const parsed = parseMeasurementNumber(value);
  return parsed == null ? null : parsed / CM_TO_INCHES;
}

export function formatMeasurementNumber(value, decimals = 1) {
  const rounded = roundMeasurement(value, decimals);
  return rounded == null ? "" : String(rounded);
}

export function getWeightUnit(unitSystem) {
  return isImperialUnitSystem(unitSystem) ? "lb" : "kg";
}

export function getDisplayWeightFromKilograms(value, unitSystem) {
  const converted = isImperialUnitSystem(unitSystem)
    ? kilogramsToPounds(value)
    : parseMeasurementNumber(value);
  return roundMeasurement(converted, 1);
}

export function getKilogramsFromDisplayWeight(value, unitSystem) {
  const converted = isImperialUnitSystem(unitSystem)
    ? poundsToKilograms(value)
    : parseMeasurementNumber(value);
  return roundMeasurement(converted, 3);
}

export function formatWeightFromKilograms(value, unitSystem, { compact = false } = {}) {
  const displayValue = getDisplayWeightFromKilograms(value, unitSystem);

  if (displayValue == null) {
    return "";
  }

  const separator = compact ? "" : " ";
  return `${formatMeasurementNumber(displayValue)}${separator}${getWeightUnit(unitSystem)}`;
}

export function formatDistanceFromMeters(value, unitSystem, { compact = false } = {}) {
  const meters = parseMeasurementNumber(value);

  if (meters == null) {
    return "";
  }

  const separator = compact ? "" : " ";

  if (isImperialUnitSystem(unitSystem)) {
    if (meters >= 1000) {
      return `${formatMeasurementNumber(kilometersToMiles(meters / 1000), 2)}${separator}mi`;
    }

    return `${formatMeasurementNumber(metersToYards(meters), 1)}${separator}yd`;
  }

  if (meters >= 1000) {
    return `${formatMeasurementNumber(meters / 1000, 2)}${separator}km`;
  }

  return `${formatMeasurementNumber(meters, 1)}${separator}m`;
}

function replaceNumberUnit(text, pattern, converter, unit, decimals = 1) {
  return text.replace(pattern, (_, rawValue) => {
    const converted = converter(rawValue);
    return converted == null
      ? _
      : `${formatMeasurementNumber(converted, decimals)} ${unit}`;
  });
}

function replaceRangeUnit(text, pattern, converter, unit, decimals = 1) {
  return text.replace(pattern, (match, rawStart, rawEnd) => {
    const start = converter(rawStart);
    const end = converter(rawEnd);

    if (start == null || end == null) {
      return match;
    }

    return `${formatMeasurementNumber(start, decimals)}-${formatMeasurementNumber(end, decimals)} ${unit}`;
  });
}

export function formatMeasurementText(value, unitSystem) {
  let text = String(value ?? "");

  if (!text) {
    return "";
  }

  if (isImperialUnitSystem(unitSystem)) {
    text = text.replace(
      /\b(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilograms?)\s*\(\s*\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?\s*(?:lb|lbs|pounds?)\s*\)/gi,
      (_, startKg, endKg) =>
        `${formatMeasurementNumber(kilogramsToPounds(startKg), 1)}-${formatMeasurementNumber(kilogramsToPounds(endKg), 1)} lb`
    );
    text = replaceRangeUnit(
      text,
      /\b(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilograms?)\b/gi,
      kilogramsToPounds,
      "lb"
    );
    text = text.replace(
      /\b(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilograms?)\s*\(\s*\d+(?:[.,]\d+)?\s*(?:lb|lbs|pounds?)\s*\)/gi,
      (_, kg) => `${formatMeasurementNumber(kilogramsToPounds(kg), 1)} lb`
    );
    text = replaceNumberUnit(
      text,
      /\b(\d+(?:[.,]\d+)?)\s*(?:km\/h|kmh|kph)\b/gi,
      (speed) => parseMeasurementNumber(speed) * KPH_TO_MPH,
      "mph"
    );
    text = replaceNumberUnit(
      text,
      /\b(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|kilograms?)\b/gi,
      kilogramsToPounds,
      "lb"
    );
    text = replaceNumberUnit(
      text,
      /\b(\d+(?:[.,]\d+)?)\s*(?:kilometers?|kilometres?|km)\b/gi,
      kilometersToMiles,
      "mi",
      2
    );
    text = replaceNumberUnit(
      text,
      /\b(\d+(?:[.,]\d+)?)\s*(?:centimeters?|centimetres?|cm)\b/gi,
      centimetersToInches,
      "in"
    );
    text = replaceNumberUnit(
      text,
      /\b(\d+(?:[.,]\d+)?)\s*(?:meters?|metres?)\b/gi,
      metersToYards,
      "yd"
    );
    text = replaceNumberUnit(
      text,
      /\b(\d+(?:[.,]\d+)?)\s*m\b/gi,
      metersToYards,
      "yd"
    );
    return text;
  }

  text = text.replace(
    /\b(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(?:lb|lbs|pounds?)\s*\(\s*\d+(?:[.,]\d+)?\s*[-–]\s*\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilograms?)\s*\)/gi,
    (_, startLb, endLb) =>
      `${formatMeasurementNumber(poundsToKilograms(startLb), 1)}-${formatMeasurementNumber(poundsToKilograms(endLb), 1)} kg`
  );
  text = replaceRangeUnit(
    text,
    /\b(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(?:lb|lbs|pounds?)\b/gi,
    poundsToKilograms,
    "kg"
  );
  text = text.replace(
    /\b(\d+(?:[.,]\d+)?)\s*(?:lb|lbs|pounds?)\s*\(\s*\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilograms?)\s*\)/gi,
    (_, lb) => `${formatMeasurementNumber(poundsToKilograms(lb), 1)} kg`
  );
  text = replaceNumberUnit(
    text,
    /\b(\d+(?:[.,]\d+)?)\s*mph\b/gi,
    (speed) => parseMeasurementNumber(speed) / KPH_TO_MPH,
    "km/h"
  );
  text = replaceNumberUnit(
    text,
    /\b(\d+(?:[.,]\d+)?)\s*(?:lb|lbs|pounds?)\b/gi,
    poundsToKilograms,
    "kg"
  );
  text = replaceNumberUnit(
    text,
    /\b(\d+(?:[.,]\d+)?)\s*(?:miles?|mi)\b/gi,
    milesToKilometers,
    "km",
    2
  );
  text = replaceNumberUnit(
    text,
    /\b(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?|yd)\b/gi,
    yardsToMeters,
    "m"
  );
  text = replaceNumberUnit(
    text,
    /\b(\d+(?:[.,]\d+)?)\s*(?:feet|foot|ft)\b/gi,
    (feet) => parseMeasurementNumber(feet) * 0.3048,
    "m"
  );
  text = replaceNumberUnit(
    text,
    /\b(\d+(?:[.,]\d+)?)\s*(?:inches|inch|in)\b/gi,
    inchesToCentimeters,
    "cm"
  );
  return text;
}
