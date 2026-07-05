export const TRAINING_DAY_TYPE_GRADIENT_DARK_STOP = "#282828";
export const TRAINING_DAY_TYPE_GRADIENT_COLOR_ALPHA = 0.35;
export const TRAINING_DAY_TYPE_GRADIENT_LOCATIONS = Object.freeze([0.2, 1]);
export const TRAINING_DAY_TYPE_GRADIENT_START = Object.freeze({ x: 0, y: 1 });
export const TRAINING_DAY_TYPE_GRADIENT_END = Object.freeze({ x: 1, y: 0 });
export const TRAINING_DAY_TYPE_OVERLAY_DARK_STOP = "#000000";
export const TRAINING_DAY_TYPE_OVERLAY_OPACITY = 0.85;
export const TRAINING_DAY_TYPE_OVERLAY_COLOR_STRENGTH = 0.32;
export const TRAINING_DAY_TYPE_OVERLAY_LOCATIONS = Object.freeze([0, 1]);
export const TRAINING_DAY_TYPE_OVERLAY_START = Object.freeze({ x: 1, y: 0 });
export const TRAINING_DAY_TYPE_OVERLAY_END = Object.freeze({ x: 0, y: 1 });

function parseHexColor(hexColor) {
  const normalizedHex = String(hexColor || "").replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
    return null;
  }

  return {
    red: Number.parseInt(normalizedHex.slice(0, 2), 16),
    green: Number.parseInt(normalizedHex.slice(2, 4), 16),
    blue: Number.parseInt(normalizedHex.slice(4, 6), 16),
  };
}

function hexToRgba(hexColor, alpha = 1) {
  const color = parseHexColor(hexColor);

  if (!color) {
    return hexColor;
  }

  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
}

function darkenHexColor(hexColor, strength = 1) {
  const color = parseHexColor(hexColor);

  if (!color) {
    return hexColor;
  }

  const toHex = (value) =>
    Math.round(value * strength)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();

  return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
}

function getOverlayColor(hexColor) {
  return darkenHexColor(hexColor, TRAINING_DAY_TYPE_OVERLAY_COLOR_STRENGTH);
}

function getGradientColor(hexColor) {
  return hexToRgba(hexColor, TRAINING_DAY_TYPE_GRADIENT_COLOR_ALPHA);
}

function createTrainingDayTypeGradient(meta) {
  return Object.freeze({
    colors: Object.freeze([
      getGradientColor(meta.color),
      TRAINING_DAY_TYPE_GRADIENT_DARK_STOP,
    ]),
    locations: TRAINING_DAY_TYPE_GRADIENT_LOCATIONS,
    start: TRAINING_DAY_TYPE_GRADIENT_START,
    end: TRAINING_DAY_TYPE_GRADIENT_END,
  });
}

function createTrainingDayTypeOverlayGradient(meta) {
  return Object.freeze({
    colors: Object.freeze([
      TRAINING_DAY_TYPE_OVERLAY_DARK_STOP,
      getOverlayColor(meta.color),
    ]),
    locations: TRAINING_DAY_TYPE_OVERLAY_LOCATIONS,
    start: TRAINING_DAY_TYPE_OVERLAY_START,
    end: TRAINING_DAY_TYPE_OVERLAY_END,
    opacity: TRAINING_DAY_TYPE_OVERLAY_OPACITY,
  });
}

export const TRAINING_DAY_TYPE_META = Object.freeze({
  force: Object.freeze({
    value: "force",
    label: "Strength",
    colorName: "blue",
    color: "#184DC8",
  }),
  power: Object.freeze({
    value: "power",
    label: "Power",
    colorName: "red",
    color: "#F82929",
  }),
  fatigue: Object.freeze({
    value: "fatigue",
    label: "Conditioning",
    colorName: "green",
    color: "#00842A",
  }),
  speed: Object.freeze({
    value: "speed",
    label: "Speed",
    colorName: "yellow",
    color: "#F5B700",
  }),
  hypertrophy: Object.freeze({
    value: "hypertrophy",
    label: "Hypertrophy",
    colorName: "purple",
    color: "#7C3AED",
  }),
  recovery: Object.freeze({
    value: "recovery",
    label: "Recovery",
    colorName: "teal",
    color: "#00A6A6",
  }),
  rest: Object.freeze({
    value: "rest",
    label: "Rest",
    colorName: "gray",
    color: "#585858",
  }),
});

export const TRAINING_DAY_TYPE_ALIASES = Object.freeze({
  conditioning: "fatigue",
  conditioning_day: "fatigue",
  hypertrophy_day: "hypertrophy",
  power_day: "power",
  recovery_day: "recovery",
  rest_day: "rest",
  speed_day: "speed",
  strength: "force",
  strength_day: "force",
});

export const TRAINING_DAY_TYPE_COLORS = Object.freeze(
  Object.fromEntries(
    Object.entries(TRAINING_DAY_TYPE_META).map(([value, meta]) => [
      value,
      meta.color,
    ])
  )
);

export const TRAINING_DAY_TYPE_LABELS = Object.freeze(
  Object.fromEntries(
    Object.entries(TRAINING_DAY_TYPE_META).map(([value, meta]) => [
      value,
      meta.label,
    ])
  )
);

export const TRAINING_DAY_TYPE_GRADIENTS = Object.freeze(
  Object.fromEntries(
    Object.entries(TRAINING_DAY_TYPE_META).map(([value, meta]) => [
      value,
      createTrainingDayTypeGradient(meta),
    ])
  )
);

export const TRAINING_DAY_TYPE_OVERLAY_GRADIENTS = Object.freeze(
  Object.fromEntries(
    Object.entries(TRAINING_DAY_TYPE_META).map(([value, meta]) => [
      value,
      createTrainingDayTypeOverlayGradient(meta),
    ])
  )
);

export function normalizeTrainingDayType(value = "") {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (TRAINING_DAY_TYPE_META[normalizedValue]) {
    return normalizedValue;
  }

  return TRAINING_DAY_TYPE_ALIASES[normalizedValue] || "";
}

export function getTrainingDayTypeMeta(value = "") {
  const normalizedType = normalizeTrainingDayType(value);

  return normalizedType ? TRAINING_DAY_TYPE_META[normalizedType] : null;
}

export function getTrainingDayTypeLabel(value = "", fallback = "") {
  return getTrainingDayTypeMeta(value)?.label || fallback;
}

export function getTrainingDayTypeColor(value = "", fallback = "") {
  return getTrainingDayTypeMeta(value)?.color || fallback;
}

export function getTrainingDayTypeGradient(value = "", fallback = null) {
  const normalizedType = normalizeTrainingDayType(value);

  return normalizedType ? TRAINING_DAY_TYPE_GRADIENTS[normalizedType] : fallback;
}

export function getTrainingDayTypeOverlayGradient(value = "", fallback = null) {
  const normalizedType = normalizeTrainingDayType(value);

  return normalizedType
    ? TRAINING_DAY_TYPE_OVERLAY_GRADIENTS[normalizedType]
    : fallback;
}
