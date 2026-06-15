export const PRIMARY_COMBAT_SPORT_OPTIONS = Object.freeze([
  Object.freeze({
    id: "boxing",
    label: "Boxing",
    value: "Boxing",
    image: require("../assets/icons/sports/boxing.png"),
  }),
  Object.freeze({
    id: "wrestling",
    label: "Wrestling",
    value: "Wrestling",
    image: require("../assets/icons/sports/wrestler.png"),
  }),
  Object.freeze({
    id: "bjj",
    label: "BJJ",
    value: "BJJ",
    image: require("../assets/icons/sports/jiujitsu.png"),
  }),
  Object.freeze({
    id: "muay-thai-kickboxing",
    label: "Kickboxing",
    value: "Muay Thai / Kickboxing",
    image: require("../assets/icons/sports/kickboxing.png"),
  }),
  Object.freeze({
    id: "judo",
    label: "Judo",
    value: "Judo",
    image: require("../assets/icons/sports/judo.png"),
  }),
  Object.freeze({
    id: "mma",
    label: "MMA",
    value: "MMA",
    image: require("../assets/icons/sports/mma.png"),
  }),
  Object.freeze({
    id: "muay-thai",
    label: "Muay Thai",
    value: "Muay Thai",
    image: require("../assets/icons/sports/muayThai.png"),
  }),
]);

export function normalizePrimaryCombatSportForOutput(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim();

  if (normalizedValue.toLowerCase() === "muay thai") {
    return "Muay Thai / Kickboxing";
  }

  return normalizedValue;
}
