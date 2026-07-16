export const CIRCUIT_FOCUS_MODES = Object.freeze({
  SPECIFIC_REGIONS: "specific_regions",
  WHOLE_BODY: "whole_body",
});

export const CIRCUIT_FOCUS_MODE_OPTIONS = Object.freeze([
  Object.freeze({
    label: "Specific muscles",
    value: CIRCUIT_FOCUS_MODES.SPECIFIC_REGIONS,
    description:
      "My grip, shoulders, legs, or another area burns out before my breathing does.",
    details:
      "Your circuit will put more work into the areas that fade first while still training the rest of your body.",
    icon: "target",
  }),
  Object.freeze({
    label: "My whole body",
    value: CIRCUIT_FOCUS_MODES.WHOLE_BODY,
    description: "Everything fades together. I just gas out overall.",
    details:
      "Your circuit will distribute work evenly across the body without prioritizing one region.",
    icon: "human-handsup",
  }),
]);

export const CIRCUIT_REGION_VALUES = Object.freeze([
  "grip_forearms",
  "arms",
  "shoulders",
  "neck",
  "upper_back",
  "trunk",
  "hips",
  "legs",
]);

const REGION_LABELS = Object.freeze({
  grip_forearms: "Grip and forearms",
  arms: "Arms",
  shoulders: "Shoulders",
  neck: "Neck",
  upper_back: "Upper back",
  trunk: "Trunk and lower back",
  hips: "Hips",
  legs: "Legs",
});

const NEUTRAL_DETAILS = Object.freeze({
  grip_forearms: "Grip and forearms fatigue during repeated holding, pulling, or carrying.",
  arms: "The arms lose repeatable force during longer efforts.",
  shoulders: "The shoulders burn out during repeated upper-body work.",
  neck: "The neck tires while maintaining strong posture and position.",
  upper_back: "The upper back fades during repeated pulling and posture work.",
  trunk: "The trunk and lower back lose posture and control under fatigue.",
  hips: "Hip drive and repeated movement slow down under fatigue.",
  legs: "The legs fade during repeated movement, stance work, and force production.",
});

const SPORT_REGION_DETAILS = Object.freeze({
  boxing: Object.freeze({
    order: ["legs", "shoulders", "arms", "trunk", "hips", "upper_back", "neck", "grip_forearms"],
    details: Object.freeze({
      legs: "Legs and stance fade late in rounds, footwork slows down",
      shoulders: "Guard drops, punches feel heavy late",
      arms: "Arms pump out from punch volume",
      trunk: "Posture and rotation fade, punches lose body behind them",
      hips: "Pivots and weight transfer get sluggish",
      upper_back: "Fatigue between the shoulder blades from holding guard",
      neck: "Neck tires from keeping the chin tucked",
      grip_forearms: "Forearms tighten up from clenching the fists",
    }),
  }),
  kickboxing: Object.freeze({
    order: ["legs", "hips", "shoulders", "neck", "grip_forearms", "trunk", "arms", "upper_back"],
    details: Object.freeze({
      legs: "Kicks slow down, stance and checks fade",
      hips: "Hip drive dies, kicks lose snap",
      shoulders: "Guard drops under kick and punch volume",
      neck: "Neck tires in the clinch",
      grip_forearms: "Arms pump out from clinch grips",
      trunk: "Trunk fades from kicks, knees, and clinch posture",
      arms: "Arms heavy from strike volume",
      upper_back: "Upper back tires from guard and clinch frames",
    }),
  }),
  wrestling: Object.freeze({
    order: ["grip_forearms", "neck", "legs", "upper_back", "shoulders", "hips", "trunk", "arms"],
    details: Object.freeze({
      grip_forearms: "Forearms blow up in hand-fighting",
      neck: "Neck fatigues fast in ties and defending position",
      legs: "Legs die in tie-ups, shots, and level changes",
      upper_back: "Upper back tires from pulling and snapping",
      shoulders: "Shoulders burn from constant hand-fighting",
      hips: "Hip drive fades in shots and finishes",
      trunk: "Lower back tires in bent-over positions",
      arms: "Arms fade from repeated pulling and posting",
    }),
  }),
  judo: Object.freeze({
    order: ["grip_forearms", "upper_back", "arms", "legs", "hips", "trunk", "shoulders", "neck"],
    details: Object.freeze({
      grip_forearms: "Grip dies first in kumi-kata battles",
      upper_back: "Pulling power fades, can't break posture late",
      arms: "Arms pump out from constant gripping and pulling",
      legs: "Legs fade from entries, footwork, and defending throws",
      hips: "Hip drive dies, entries lose speed",
      trunk: "Trunk fades in newaza and defending turnovers",
      shoulders: "Shoulders tire from grip fighting overhead",
      neck: "Neck fatigues defending pins and turnovers",
    }),
  }),
  bjj: Object.freeze({
    order: ["grip_forearms", "trunk", "hips", "arms", "neck", "shoulders", "upper_back", "legs"],
    details: Object.freeze({
      grip_forearms: "Grip dies first, can't hold sleeves or collars late",
      trunk: "Trunk fades in guard work and scrambles",
      hips: "Hip movement slows, guard retention fades",
      arms: "Arms pump out from framing and gripping",
      neck: "Neck tires defending chokes and pressure",
      shoulders: "Shoulders burn from frames and overhooks",
      upper_back: "Pulling fades in sweeps and back control",
      legs: "Legs tire in closed guard and standing exchanges",
    }),
  }),
  mma: Object.freeze({
    order: ["legs", "grip_forearms", "shoulders", "trunk", "neck", "hips", "arms", "upper_back"],
    details: Object.freeze({
      legs: "Legs fade from footwork, kicks, and takedowns",
      grip_forearms: "Grip and forearms die in clinch and grappling",
      shoulders: "Guard drops, punches get heavy late",
      trunk: "Trunk fades in scrambles and against the cage",
      neck: "Neck tires in the clinch and defending on the ground",
      hips: "Hip drive dies in shots, sprawls, and kicks",
      arms: "Arms fade from strike volume and grappling",
      upper_back: "Upper back tires from pulling and cage work",
    }),
  }),
});

function getSportConfigKey(primaryCombatSport = "") {
  const sport = String(primaryCombatSport || "").trim().toLowerCase();

  if (sport === "boxing") return "boxing";
  if (sport === "wrestling") return "wrestling";
  if (sport === "judo") return "judo";
  if (sport === "bjj" || sport.includes("jiu")) return "bjj";
  if (sport === "mma" || sport.includes("mixed martial")) return "mma";
  if (sport.includes("muay") || sport.includes("kickbox")) return "kickboxing";

  return "";
}

export function getCircuitRegionOptions(primaryCombatSport = "") {
  const sportConfig = SPORT_REGION_DETAILS[getSportConfigKey(primaryCombatSport)];
  const order = sportConfig?.order || CIRCUIT_REGION_VALUES;

  return order.map((value) => Object.freeze({
    label: REGION_LABELS[value],
    value,
    description: sportConfig?.details?.[value] || NEUTRAL_DETAILS[value],
  }));
}

export function isCircuitFocusMode(value) {
  return Object.values(CIRCUIT_FOCUS_MODES).includes(value);
}

export function normalizeCircuitRegionValues(values = []) {
  const validValues = new Set(CIRCUIT_REGION_VALUES);

  return Array.from(
    new Set((Array.isArray(values) ? values : []).filter((value) => validValues.has(value)))
  );
}
