import {
  areAppLogicSettingsEqual,
  getAppLogicSettingsFormState,
  normalizeAppLogicSettings,
} from "./appLogicSettings.js";
import { getNormalizedWeekday } from "./weekdays.js";

const STRIKING_COMBAT_SPORTS = new Set([
  "boxing",
  "kickboxing",
  "muay thai",
  "muay thai / kickboxing",
]);

export function isStrikingCombatSport(value) {
  return (
    typeof value === "string" &&
    STRIKING_COMBAT_SPORTS.has(value.trim().toLowerCase())
  );
}

function allowsHeavyBag(source = {}) {
  const sport = source?.primaryCombatSport;
  return typeof sport !== "string" || !sport.trim() || isStrikingCombatSport(sport);
}

export const STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS = Object.freeze([
  {
    label: "Beginner - little or no lifting/conditioning experience",
    value: "beginner",
  },
  {
    label: "Intermediate - comfortable with basic lifting and conditioning",
    value: "intermediate",
  },
  {
    label: "Advanced - very experienced with lifting, power, and conditioning work",
    value: "advanced",
  },
]);

export const DESIRED_TRAINING_OPTIONS = Object.freeze([
  { label: "Power only", value: "strength_power" },
  {
    label: "Power and Endurance",
    value: "strength_power_endurance",
  },
  { label: "Endurance only", value: "endurance" },
]);

export const HYBRID_SESSION_STRUCTURE_OPTIONS = Object.freeze([
  {
    label: "Separate sessions (Recommended)",
    value: "separate_sessions",
    description:
      "Keep power and endurance on different training days for better quality and recovery.",
  },
  {
    label: "Same session",
    value: "same_session",
    description:
      "Train both in one session, with power and strength before endurance work.",
  },
]);

export const ENDURANCE_MODALITY_OPTIONS = Object.freeze([
  {
    label: "Rowing Ergometer",
    value: "rowing_ergometer",
    description:
      "Measurable total-body steady work, intervals, threshold efforts, and hard intervals without impact.",
  },
  {
    label: "Skiing Ergometer",
    value: "skiing_ergometer",
    description:
      "Upper-body and trunk-driven conditioning with low leg impact, especially useful when leg fatigue is high.",
  },
  {
    label: "Assault Bike",
    value: "assault_bike",
    description:
      "Low-impact aerobic intervals, threshold work, hard intervals, repeated bursts, and mixed upper/lower-body conditioning.",
  },
  {
    label: "Running",
    value: "running",
    description:
      "Accessible general aerobic work with strong off-camp value, but higher lower-body impact cost.",
  },
  {
    label: "Sprinting",
    value: "sprinting",
    description:
      "Max-speed, acceleration, and repeated high-power exposure when speed quality and tissue tolerance are high.",
  },
  {
    label: "Bicycling",
    value: "bicycling",
    description:
      "Lower-impact aerobic volume, tempo work, and longer conditioning sessions when running impact is not ideal.",
  },
  {
    label: "Arm Crank Machine",
    value: "arm_crank_machine",
    description:
      "Upper-body conditioning with minimal lower-body loading, especially useful for wrestlers or lower-body limitations.",
  },
  {
    label: "VersaClimber",
    value: "versaclimber",
    description:
      "Low-impact full-body climbing intervals that blend trunk, upper-body, and leg drive.",
  },
  {
    label: "Swimming",
    value: "swimming",
    description:
      "Low-impact aerobic or recovery-oriented conditioning when joints, legs, or combat load need relief.",
  },
  {
    label: "Heavy Bag Endurance",
    value: "heavy_bag",
    description:
      "Striker-specific aerobic bag work, sustained combinations, repeated flurries, and fight-camp simulation.",
  },
  {
    label: "Circuit Training",
    value: "circuit_training",
    description:
      "Local muscular endurance, repeated-effort capacity, grip/arm/trunk weak links, and blended work capacity.",
  },
  {
    label: "Sport Specific",
    value: "sport_specific",
    description:
      "Match-prep conditioning that stays closest to the athlete's sport demands when competition specificity matters.",
  },
]);

export const ENDURANCE_SESSION_COUNT_OPTIONS = Object.freeze(
  Array.from({ length: 7 }, (_, index) => ({
    label: `${index + 1}`,
    value: index + 1,
  }))
);

export const ENDURANCE_FORMAT_OPTIONS = Object.freeze([
  {
    label: "Low-intensity aerobic development",
    value: "low_intensity_aerobic",
  },
  {
    label: "Aerobic intervals",
    value: "aerobic_intervals",
  },
  {
    label: "High-intensity intervals",
    value: "high_intensity_intervals",
  },
  {
    label: "Sport-specific conditioning",
    value: "sport_specific_conditioning",
  },
]);

export const CIRCUIT_PRIORITY_OPTIONS = Object.freeze([
  {
    label: "Local muscular endurance",
    value: "local_muscular_endurance",
    description:
      "Targets the muscles that burn out before your lungs do, using focused circuits for repeated contractions under fatigue.",
  },
  {
    label: "Repeated high-effort capacity",
    value: "repeated_high_effort_capacity",
    description:
      "Builds the ability to produce hard bursts again and again, such as scrambles, shots, flurries, or clinch surges.",
  },
  {
    label: "Whole-body work capacity",
    value: "whole_body_work_capacity",
    description:
      "General full-body conditioning when fatigue is broad rather than tied to one area or specific fight action.",
  },
  {
    label: "Sport-specific fatigue resistance",
    value: "sport_specific_fatigue_resistance",
    description:
      "Keeps circuit work closer to the positions, rhythm, and fatigue patterns of your sport or upcoming event.",
  },
  {
    label: "Aerobic recovery between bursts",
    value: "aerobic_recovery_between_bursts",
    description:
      "Improves how quickly you settle your breathing and heart rate between exchanges without turning every session into a max effort.",
  },
  {
    label: "Grip endurance",
    value: "grip_endurance",
    description:
      "Prioritizes forearms, hands, and grip-specific staying power for hand-fighting, clinching, pulling, or controlling grips.",
  },
  {
    label: "Neck endurance",
    value: "neck_endurance",
    description:
      "Builds neck and upper-back tolerance for grappling posture, clinch pressure, head position, and longer rounds.",
  },
  {
    label: "Trunk endurance",
    value: "trunk_endurance",
    description:
      "Targets core, hips, and posture so you can keep position, brace, rotate, and resist fatigue late in rounds.",
  },
  {
    label: "Shoulder endurance",
    value: "shoulder_endurance",
    description:
      "Focuses on shoulders and arms for punching volume, framing, posting, hand-fighting, or upper-body fatigue resistance.",
  },
  {
    label: "Leg endurance",
    value: "leg_endurance",
    description:
      "Targets stance, shots, tie-ups, kicking volume, and lower-body fatigue when your legs are the first limiter.",
  },
]);

export const CIRCUIT_GOAL_EXAMPLES = Object.freeze([
  "My legs fatigue first.",
  "My shoulders and arms burn out late.",
  "I lose posture and trunk control late in rounds.",
  "I can go hard once, but not repeatedly.",
  "My stance and legs fade when kicking a lot.",
  "My whole body gasses.",
  "My arms and forearms blow up in hand-fighting.",
  "My neck and upper back fatigue too fast.",
  "I fade after hard scrambles.",
  "My legs die in tie-ups and shots.",
  "My trunk and hips fatigue during longer rolls.",
  "I lose power output between bursts.",
  "I want better aerobic recovery, not a death circuit.",
  "I want full-body conditioning without anything fancy.",
]);

export const HEAVY_BAG_ENDURANCE_TARGET_OPTIONS = Object.freeze([
  { label: "Aerobic bag work", value: "aerobic_bag_work" },
  { label: "Tempo / sustained conditioning", value: "tempo_sustained_conditioning" },
  { label: "Repeated-burst bag work", value: "repeated_burst_bag_work" },
  { label: "Local upper-body endurance", value: "local_upper_body_endurance" },
  { label: "Fight-camp simulation", value: "sport_specific_fight_camp_simulation" },
]);

export const SPRINTING_TARGET_OPTIONS = Object.freeze([
  { label: "Speed / explosiveness", value: "speed_explosiveness" },
  { label: "Repeat bursts", value: "repeat_bursts" },
  { label: "Hard conditioning", value: "hard_conditioning" },
]);
const MAX_PREFERRED_ENDURANCE_MODALITIES = 3;

export const CAPABILITY_RATING_OPTIONS = Object.freeze([
  { label: "Yes", value: "yes" },
  { label: "Somewhat", value: "somewhat" },
  { label: "No", value: "no" },
]);

export const TRAINING_CAPABILITY_GROUPS = Object.freeze([
  {
    title: "Lifting confidence",
    items: Object.freeze([
      {
        label: "Compound lifts",
        value: "compoundLifts",
        description: "Squat, deadlift, bench, row, overhead press",
      },
      {
        label: "Single-leg lifts",
        value: "singleLegLifts",
        description: "Split squat, lunge, step-up",
      },
      {
        label: "Pull-Ups and Chin-Ups",
        value: "pullingWork",
        description: "How confident are you in your ability to perform them?",
      },
    ]),
  },
  {
    title: "Power training",
    items: Object.freeze([
      {
        label: "Olympic-lift variations",
        value: "olympicLiftVariations",
        description: "Power clean, hang clean, push press, split jerk",
      },
      {
        label: "Plyometrics",
        value: "plyometrics",
        description: "Jumps, bounds, hops, landing drills",
      },
      {
        label: "Ballistic training",
        value: "ballisticTraining",
        description: "Medicine-ball throws, jump squats, landmine punches",
      },
    ]),
  },
  {
    title: "Conditioning",
    items: Object.freeze([
      {
        label: "Running / sprinting",
        value: "runningSprinting",
      },
      {
        label: "Bike / rower / assault bike",
        value: "bikeRowerAssaultBike",
      },
      {
        label: "Circuit training",
        value: "circuitTraining",
      },
      {
        label: "Heavy bag",
        value: "heavyBag",
        description: "If striker",
      },
    ]),
  },
]);

export const SESSION_DURATION_OPTIONS = Object.freeze([
  { label: "15 min", value: "15_min" },
  { label: "30 min", value: "30_min" },
  { label: "45 min", value: "45_min" },
  { label: "60 min", value: "60_min" },
  { label: "75 min", value: "75_min" },
  { label: "90 min", value: "90_min" },
  { label: "No limit", value: "no_time_limit" },
]);

export const EQUIPMENT_OPTIONS = Object.freeze([
  { label: "Full gym", value: "full_gym" },
  { label: "Minimal equipment", value: "home_minimal" },
  { label: "Home kit only", value: "bodyweight_only" },
]);

const SESSION_DURATION_MINUTES = Object.freeze({
  "15_min": 15,
  "30_min": 30,
  "45_min": 45,
  "60_min": 60,
  "75_min": 75,
  "90_min": 90,
  no_time_limit: null,
});

export const TRAINING_PREFERENCES_DEFAULTS = Object.freeze({
  experience: "beginner",
  desiredTraining: "strength_power_endurance",
  hybridSessionStructure: "separate_sessions",
  trainingCapabilities: Object.freeze({}),
  preferredEnduranceModalities: Object.freeze([]),
  enduranceSessionsPerWeek: 1,
  preferredEnduranceFormat: "low_intensity_aerobic",
  circuitTrainingGoalInput: "",
  circuitTrainingPrimaryPriority: "",
  circuitTrainingSecondaryPriorities: Object.freeze([]),
  heavyBagEnduranceTarget: "",
  sprintingTarget: "",
  eventPreparation: "",
  sessionDuration: "60_min",
  equipment: "full_gym",
  daysPerWeek: 3,
  preferredWeekdays: [],
  preferredDayTypes: [],
  injuriesInput: "",
});

function isAllowedValue(value, options) {
  return options.some((option) => option.value === value);
}

function parseDaysPerWeek(value) {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : TRAINING_PREFERENCES_DEFAULTS.daysPerWeek;
}

function getTrainingCapabilityKeys() {
  return TRAINING_CAPABILITY_GROUPS.flatMap((group) =>
    group.items.map((item) => item.value)
  );
}

function normalizeCapabilityRating(value) {
  return isAllowedValue(value, CAPABILITY_RATING_OPTIONS) ? value : "somewhat";
}

function normalizeEnumOptionValue(value, options) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return isAllowedValue(normalizedValue, options) ? normalizedValue : "";
}

function normalizeEnduranceModalityValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const aliases = {
    bike: "bicycling",
    cycling: "bicycling",
    rowing: "rowing_ergometer",
    rower: "rowing_ergometer",
    ski_erg: "skiing_ergometer",
    skierg: "skiing_ergometer",
    skiing: "skiing_ergometer",
    assaultbike: "assault_bike",
    airdyne: "assault_bike",
    arm_crank: "arm_crank_machine",
    arm_bike: "arm_crank_machine",
    heavy_bag_endurance: "heavy_bag",
    bag_work: "heavy_bag",
    sport_specific_match_prep: "sport_specific",
    sport_specific_match_prep_alternative: "sport_specific",
    match_prep: "sport_specific",
    versa_climber: "versaclimber",
  };
  const resolvedValue = aliases[normalizedValue] ?? normalizedValue;

  return isAllowedValue(resolvedValue, ENDURANCE_MODALITY_OPTIONS)
    ? resolvedValue
    : "";
}

function normalizeEnduranceModalities(source = {}) {
  const nestedSettings =
    source.enduranceTraining && typeof source.enduranceTraining === "object"
      ? source.enduranceTraining
      : source.endurancePreferences && typeof source.endurancePreferences === "object"
        ? source.endurancePreferences
        : {};
  const rawModalities =
    source.preferredEnduranceModalities ??
    source.enduranceModalities ??
    nestedSettings.preferredModalities ??
    nestedSettings.modalities ??
    source.preferredEnduranceModality ??
    source.enduranceModality ??
    nestedSettings.preferredModality ??
    nestedSettings.modality ??
    TRAINING_PREFERENCES_DEFAULTS.preferredEnduranceModalities;
  const modalityList = Array.isArray(rawModalities)
    ? rawModalities
    : [rawModalities];

  return Array.from(
    new Set(
      modalityList
        .map(normalizeEnduranceModalityValue)
        .filter(Boolean)
    )
  );
}

function normalizeEnduranceSessionCount(value, maxSessions = 5) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);
  const parsedMaxSessions = Number.parseInt(maxSessions, 10);
  const resolvedMaxSessions =
    Number.isFinite(parsedMaxSessions) && parsedMaxSessions > 0
      ? Math.min(5, parsedMaxSessions)
      : 5;

  if (!Number.isFinite(parsedValue)) {
    return TRAINING_PREFERENCES_DEFAULTS.enduranceSessionsPerWeek;
  }

  return Math.min(resolvedMaxSessions, Math.max(1, parsedValue));
}

function classifyCircuitTrainingGoal(goalInput = "") {
  const text = typeof goalInput === "string" ? goalInput.toLowerCase() : "";
  const matches = [];
  const add = (value, keywords = []) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      matches.push(value);
    }
  };

  add("grip_endurance", ["grip", "forearm", "hand-fighting", "hand fighting", "towel"]);
  add("neck_endurance", ["neck", "upper back"]);
  add("trunk_endurance", ["trunk", "posture", "core", "hip", "hips"]);
  add("shoulder_endurance", ["shoulder", "arms burn", "arm burn", "punch", "flurry"]);
  add("leg_endurance", ["leg", "legs", "stance", "kick", "tie-up", "tie up", "shot"]);
  add("repeated_high_effort_capacity", [
    "go hard once",
    "not repeatedly",
    "repeat",
    "scramble",
    "burst",
    "power output",
  ]);
  add("aerobic_recovery_between_bursts", ["aerobic recovery", "recover", "breath"]);
  add("whole_body_work_capacity", ["whole body", "gasses", "gas overall", "everywhere"]);
  add("sport_specific_fatigue_resistance", [
    "round",
    "boxing",
    "wrestl",
    "bjj",
    "mma",
    "kick",
    "clinch",
    "hand-fighting",
    "hand fighting",
  ]);

  if (matches.length === 0 && text.trim()) {
    matches.push("whole_body_work_capacity");
  }

  return Array.from(new Set(matches));
}

function normalizeCircuitPriorities(primaryPriority, secondaryPriorities, goalInput) {
  const inferredPriorities = classifyCircuitTrainingGoal(goalInput);
  const normalizedPrimaryPriority =
    normalizeEnumOptionValue(primaryPriority, CIRCUIT_PRIORITY_OPTIONS) ||
    inferredPriorities[0] ||
    "";
  const rawSecondaryPriorities = Array.isArray(secondaryPriorities)
    ? secondaryPriorities
    : [];
  const normalizedSecondaryPriorities = Array.from(
    new Set([
      ...rawSecondaryPriorities
        .map((priority) => normalizeEnumOptionValue(priority, CIRCUIT_PRIORITY_OPTIONS))
        .filter(Boolean),
      ...inferredPriorities.slice(1),
    ])
  ).filter((priority) => priority !== normalizedPrimaryPriority);

  return {
    primaryPriority: normalizedPrimaryPriority,
    secondaryPriorities: normalizedSecondaryPriorities,
  };
}

function getNestedEnduranceSettings(source = {}) {
  return source.enduranceTraining && typeof source.enduranceTraining === "object"
    ? source.enduranceTraining
    : source.endurancePreferences && typeof source.endurancePreferences === "object"
      ? source.endurancePreferences
      : {};
}

function normalizeHybridSessionStructure(source = {}, desiredTraining) {
  if (desiredTraining !== "strength_power_endurance") {
    return "";
  }

  const nestedSettings = getNestedEnduranceSettings(source);
  const value =
    source.hybridSessionStructure ??
    source.endurancePowerSessionStructure ??
    nestedSettings.sessionStructure;

  return isAllowedValue(value, HYBRID_SESSION_STRUCTURE_OPTIONS)
    ? value
    : TRAINING_PREFERENCES_DEFAULTS.hybridSessionStructure;
}

function normalizeEnduranceTrainingSettings(source = {}, desiredTraining, daysPerWeek = 5) {
  const nestedSettings = getNestedEnduranceSettings(source);
  const preferredEnduranceModalities = normalizeEnduranceModalities(source)
    .filter((modality) => modality !== "heavy_bag" || allowsHeavyBag(source))
    .slice(0, MAX_PREFERRED_ENDURANCE_MODALITIES);
  const circuitSettings =
    nestedSettings.circuitTraining && typeof nestedSettings.circuitTraining === "object"
      ? nestedSettings.circuitTraining
      : {};
  const heavyBagSettings =
    nestedSettings.heavyBag && typeof nestedSettings.heavyBag === "object"
      ? nestedSettings.heavyBag
      : {};
  const sprintingSettings =
    nestedSettings.sprinting && typeof nestedSettings.sprinting === "object"
      ? nestedSettings.sprinting
      : {};
  const circuitTrainingGoalInput =
    typeof source.circuitTrainingGoalInput === "string"
      ? source.circuitTrainingGoalInput.trim()
      : typeof circuitSettings.goalInput === "string"
        ? circuitSettings.goalInput.trim()
        : "";
  const circuitPriorities = normalizeCircuitPriorities(
    source.circuitTrainingPrimaryPriority ?? circuitSettings.primaryPriority,
    source.circuitTrainingSecondaryPriorities ?? circuitSettings.secondaryPriorities,
    circuitTrainingGoalInput
  );
  const includeEndurance =
    desiredTraining === "endurance" ||
    desiredTraining === "strength_power_endurance" ||
    preferredEnduranceModalities.length > 0;

  return {
    include: includeEndurance,
    sessionStructure: normalizeHybridSessionStructure(source, desiredTraining),
    modalities: preferredEnduranceModalities,
    sessionsPerWeek: normalizeEnduranceSessionCount(
      source.enduranceSessionsPerWeek ??
      source.enduranceSessionCount ??
      nestedSettings.sessionsPerWeek ??
      nestedSettings.sessionCount,
      daysPerWeek
    ),
    preferredFormat:
      normalizeEnumOptionValue(
        source.preferredEnduranceFormat ??
          source.enduranceFormat ??
          nestedSettings.preferredFormat ??
          nestedSettings.format,
        ENDURANCE_FORMAT_OPTIONS
      ) || TRAINING_PREFERENCES_DEFAULTS.preferredEnduranceFormat,
    circuitTraining: {
      goalInput: circuitTrainingGoalInput,
      primaryPriority: circuitPriorities.primaryPriority,
      secondaryPriorities: circuitPriorities.secondaryPriorities,
    },
    heavyBag: {
      target:
        allowsHeavyBag(source)
          ? normalizeEnumOptionValue(
              source.heavyBagEnduranceTarget ?? heavyBagSettings.target,
              HEAVY_BAG_ENDURANCE_TARGET_OPTIONS
            ) || ""
          : "",
    },
    sprinting: {
      target:
        normalizeEnumOptionValue(
          source.sprintingTarget ??
            sprintingSettings.target,
          SPRINTING_TARGET_OPTIONS
        ) || "",
    },
  };
}

function normalizeTrainingCapabilities(source = {}) {
  const rawCapabilities =
    source.trainingCapabilities && typeof source.trainingCapabilities === "object"
      ? source.trainingCapabilities
      : {};
  const legacyCompetencyValues = Array.isArray(source.competencyAndLimitations)
    ? new Set(source.competencyAndLimitations)
    : new Set();
  const legacyOverrides = {
    compoundLifts: legacyCompetencyValues.has("barbells") ? "yes" : undefined,
    olympicLiftVariations: legacyCompetencyValues.has("olympic_lifts")
      ? "yes"
      : undefined,
    ballisticTraining: legacyCompetencyValues.has("ballistic_training")
      ? "yes"
      : undefined,
    plyometrics:
      source.plyometricsExperience === "none"
        ? "no"
        : source.plyometricsExperience === "beginner"
          ? "somewhat"
          : source.plyometricsExperience === "intermediate" ||
              source.plyometricsExperience === "advanced"
            ? "yes"
            : undefined,
  };

  return getTrainingCapabilityKeys().reduce((accumulator, key) => {
    accumulator[key] =
      key === "heavyBag" && !allowsHeavyBag(source)
        ? "no"
        : normalizeCapabilityRating(rawCapabilities[key] ?? legacyOverrides[key]);
    return accumulator;
  }, {});
}

function normalizeDesiredTraining(source = {}) {
  if (isAllowedValue(source.desiredTraining, DESIRED_TRAINING_OPTIONS)) {
    return source.desiredTraining;
  }

  if (
    source.goal === "strength" ||
    source.goal === "power" ||
    source.goal === "hypertrophy"
  ) {
    return "strength_power";
  }

  return TRAINING_PREFERENCES_DEFAULTS.desiredTraining;
}

function getLegacyGoalFromDesiredTraining(desiredTraining) {
  switch (desiredTraining) {
    case "endurance":
      return "conditioning";
    case "strength_power":
      return "power";
    case "strength_power_endurance":
    default:
      return "general";
  }
}

function normalizeEventPreparation(source = {}) {
  if (typeof source.eventPreparation === "string") {
    return source.eventPreparation.trim();
  }

  if (Array.isArray(source.competitionEvents)) {
    return source.competitionEvents
      .map((event = {}) => {
        if (typeof event === "string") {
          return event.trim();
        }

        return [
          typeof event.date === "string" ? event.date.trim() : "",
          typeof event.targetPeakDate === "string"
            ? `peak ${event.targetPeakDate.trim()}`
            : "",
          typeof event.priority === "string" ? `${event.priority} priority` : "",
        ]
          .filter(Boolean)
          .join(" - ");
      })
      .filter(Boolean)
      .join("; ");
  }

  return (
    typeof source.competitionTimeline === "string"
      ? source.competitionTimeline.trim()
      : typeof source.competitionDate === "string"
        ? source.competitionDate.trim()
        : ""
  );
}

function normalizeSessionDuration(source = {}) {
  const rawValue = source.sessionDuration;
  if (isAllowedValue(rawValue, SESSION_DURATION_OPTIONS)) {
    return rawValue;
  }

  const parsedMinutes = Number.parseInt(
    rawValue ?? source.sessionDurationMinutes,
    10
  );
  const matchingOption = SESSION_DURATION_OPTIONS.find(
    (option) => SESSION_DURATION_MINUTES[option.value] === parsedMinutes
  );

  return matchingOption
    ? matchingOption.value
    : TRAINING_PREFERENCES_DEFAULTS.sessionDuration;
}

function normalizeEquipment(source = {}) {
  if (isAllowedValue(source.equipment, EQUIPMENT_OPTIONS)) {
    return source.equipment;
  }

  if (isAllowedValue(source.equipmentAccess, EQUIPMENT_OPTIONS)) {
    return source.equipmentAccess;
  }

  return TRAINING_PREFERENCES_DEFAULTS.equipment;
}

export function getSessionDurationMinutes(sessionDuration) {
  const normalizedSessionDuration = normalizeSessionDuration({
    sessionDuration,
  });

  return SESSION_DURATION_MINUTES[normalizedSessionDuration];
}

export function getNormalizedSessionDuration(source = {}) {
  return normalizeSessionDuration(source);
}

function normalizeInjuries(source = {}) {
  const rawInput =
    typeof source.injuriesInput === "string"
      ? source.injuriesInput
      : Array.isArray(source.injuries)
        ? source.injuries.join(", ")
        : typeof source.injuries === "string"
          ? source.injuries
          : "";

  return rawInput
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getRawPreferredWeekdays(source = {}) {
  if (Array.isArray(source.preferredWeekdays)) {
    return source.preferredWeekdays;
  }

  if (Array.isArray(source.preferredTrainingDays)) {
    return source.preferredTrainingDays;
  }

  if (typeof source.preferredWeekdays === "string") {
    return source.preferredWeekdays.split(",");
  }

  return TRAINING_PREFERENCES_DEFAULTS.preferredWeekdays;
}

function normalizePreferredWeekdays(source = {}, daysPerWeek) {
  const rawPreferredWeekdays = getRawPreferredWeekdays(source);

  return Array.from({ length: daysPerWeek }, (_, index) =>
    getNormalizedWeekday(rawPreferredWeekdays[index])
  );
}
const PREFERRED_DAY_TYPES = Object.freeze(["force", "power", "fatigue"]);

function normalizePreferredDayTypes(source = {}, daysPerWeek) {
  const rawTypes = Array.isArray(source.preferredDayTypes)
    ? source.preferredDayTypes
    : [];

  return Array.from({ length: daysPerWeek }, (_, index) =>
    PREFERRED_DAY_TYPES.includes(rawTypes[index]) ? rawTypes[index] : ""
  );
}

export function getTrainingPreferencesFormState(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const daysPerWeek = parseDaysPerWeek(
    safeSource.daysPerWeek ?? safeSource.sessionsPerWeek
  );
  const desiredTraining = normalizeDesiredTraining(safeSource);
  const eventPreparation = normalizeEventPreparation(safeSource);
  const sessionDuration = normalizeSessionDuration(safeSource);
  const equipment = normalizeEquipment(safeSource);
  const enduranceTraining = normalizeEnduranceTrainingSettings(
    safeSource,
    desiredTraining,
    daysPerWeek
  );

  return {
    primaryCombatSport:
      typeof safeSource.primaryCombatSport === "string"
        ? safeSource.primaryCombatSport.trim()
        : "",
    experience: isAllowedValue(
      safeSource.experience,
      STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS
    )
      ? safeSource.experience
      : TRAINING_PREFERENCES_DEFAULTS.experience,
    desiredTraining,
    hybridSessionStructure: enduranceTraining.sessionStructure,
    trainingCapabilities: normalizeTrainingCapabilities(safeSource),
    preferredEnduranceModalities: enduranceTraining.modalities,
    enduranceSessionsPerWeek: enduranceTraining.sessionsPerWeek,
    preferredEnduranceFormat: enduranceTraining.preferredFormat,
    circuitTrainingGoalInput: enduranceTraining.circuitTraining.goalInput,
    circuitTrainingPrimaryPriority: enduranceTraining.circuitTraining.primaryPriority,
    circuitTrainingSecondaryPriorities:
      enduranceTraining.circuitTraining.secondaryPriorities,
    heavyBagEnduranceTarget: enduranceTraining.heavyBag.target,
    sprintingTarget: enduranceTraining.sprinting.target,
    eventPreparation,
    sessionDuration,
    equipment,
    daysPerWeek,
    preferredWeekdays: normalizePreferredWeekdays(safeSource, daysPerWeek),
    preferredDayTypes: normalizePreferredDayTypes(safeSource, daysPerWeek),
    injuriesInput: Array.isArray(safeSource.injuries)
      ? safeSource.injuries.join(", ")
      : typeof safeSource.injuriesInput === "string"
        ? safeSource.injuriesInput
        : typeof safeSource.injuries === "string"
          ? safeSource.injuries
          : TRAINING_PREFERENCES_DEFAULTS.injuriesInput,
    ...getAppLogicSettingsFormState(safeSource),
  };
}

export function normalizeTrainingPreferences(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const daysPerWeek = parseDaysPerWeek(
    safeSource.daysPerWeek ?? safeSource.sessionsPerWeek
  );
  const desiredTraining = normalizeDesiredTraining(safeSource);
  const eventPreparation = normalizeEventPreparation(safeSource);
  const equipment = normalizeEquipment(safeSource);
  const enduranceTraining = normalizeEnduranceTrainingSettings(
    safeSource,
    desiredTraining,
    daysPerWeek
  );
  const appLogicSettings = normalizeAppLogicSettings({
    ...safeSource,
    competitionTimeline:
      eventPreparation ||
      safeSource.competitionTimeline ||
      "",
  });
  const sessionDuration = normalizeSessionDuration(safeSource);

  return {
    primaryCombatSport:
      typeof safeSource.primaryCombatSport === "string"
        ? safeSource.primaryCombatSport.trim()
        : "",
    goal: getLegacyGoalFromDesiredTraining(desiredTraining),
    desiredTraining,
    hybridSessionStructure: enduranceTraining.sessionStructure,
    experience: isAllowedValue(
      safeSource.experience,
      STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS
    )
      ? safeSource.experience
      : TRAINING_PREFERENCES_DEFAULTS.experience,
    trainingCapabilities: normalizeTrainingCapabilities(safeSource),
    preferredEnduranceModalities: enduranceTraining.modalities,
    enduranceSessionsPerWeek: enduranceTraining.sessionsPerWeek,
    preferredEnduranceFormat: enduranceTraining.preferredFormat,
    circuitTrainingGoalInput: enduranceTraining.circuitTraining.goalInput,
    circuitTrainingPrimaryPriority: enduranceTraining.circuitTraining.primaryPriority,
    circuitTrainingSecondaryPriorities:
      enduranceTraining.circuitTraining.secondaryPriorities,
    heavyBagEnduranceTarget: enduranceTraining.heavyBag.target,
    sprintingTarget: enduranceTraining.sprinting.target,
    enduranceTraining,
    eventPreparation,
    sessionDuration,
    sessionDurationMinutes: SESSION_DURATION_MINUTES[sessionDuration],
    equipment,
    daysPerWeek,
    preferredWeekdays: normalizePreferredWeekdays(safeSource, daysPerWeek),
    preferredDayTypes: normalizePreferredDayTypes(safeSource, daysPerWeek),
    injuries: normalizeInjuries(safeSource),
    ...appLogicSettings,
  };
}

export function mergeTrainingPreferences(questionnaire = {}, patch = {}) {
  const safeQuestionnaire =
    questionnaire && typeof questionnaire === "object" ? questionnaire : {};
  const safePatch = patch && typeof patch === "object" ? patch : {};
  const merged = {
    ...safeQuestionnaire,
    ...safePatch,
  };
  const {
    injuriesInput: _injuriesInput,
    competencyAndLimitations: _competencyAndLimitations,
    competitionDate: _competitionDate,
    competitionEvents: _competitionEvents,
    equipmentAccess: _equipmentAccess,
    plyometricsExperience: _plyometricsExperience,
    primaryStyle: _primaryStyle,
    weightClass: _weightClass,
    ...mergedWithoutHelperFields
  } = merged;

  return {
    ...mergedWithoutHelperFields,
    ...normalizeTrainingPreferences(merged),
  };
}

export function areTrainingPreferencesEqual(left, right) {
  const normalizedLeft = normalizeTrainingPreferences(left);
  const normalizedRight = normalizeTrainingPreferences(right);

  return (
    normalizedLeft.desiredTraining === normalizedRight.desiredTraining &&
    normalizedLeft.hybridSessionStructure ===
      normalizedRight.hybridSessionStructure &&
    normalizedLeft.experience === normalizedRight.experience &&
    getTrainingCapabilityKeys().every(
      (key) =>
        normalizedLeft.trainingCapabilities[key] ===
        normalizedRight.trainingCapabilities[key]
    ) &&
    normalizedLeft.preferredEnduranceModalities.length ===
      normalizedRight.preferredEnduranceModalities.length &&
    normalizedLeft.preferredEnduranceModalities.every(
      (value, index) => value === normalizedRight.preferredEnduranceModalities[index]
    ) &&
    normalizedLeft.enduranceSessionsPerWeek ===
      normalizedRight.enduranceSessionsPerWeek &&
    normalizedLeft.preferredEnduranceFormat ===
      normalizedRight.preferredEnduranceFormat &&
    normalizedLeft.circuitTrainingGoalInput ===
      normalizedRight.circuitTrainingGoalInput &&
    normalizedLeft.circuitTrainingPrimaryPriority ===
      normalizedRight.circuitTrainingPrimaryPriority &&
    normalizedLeft.circuitTrainingSecondaryPriorities.length ===
      normalizedRight.circuitTrainingSecondaryPriorities.length &&
    normalizedLeft.circuitTrainingSecondaryPriorities.every(
      (value, index) =>
        value === normalizedRight.circuitTrainingSecondaryPriorities[index]
    ) &&
    normalizedLeft.heavyBagEnduranceTarget ===
      normalizedRight.heavyBagEnduranceTarget &&
    normalizedLeft.sprintingTarget === normalizedRight.sprintingTarget &&
    normalizedLeft.eventPreparation === normalizedRight.eventPreparation &&
    normalizedLeft.sessionDuration === normalizedRight.sessionDuration &&
    normalizedLeft.equipment === normalizedRight.equipment &&
    normalizedLeft.daysPerWeek === normalizedRight.daysPerWeek &&
    normalizedLeft.preferredWeekdays.length ===
      normalizedRight.preferredWeekdays.length &&
    normalizedLeft.preferredWeekdays.every(
      (value, index) => value === normalizedRight.preferredWeekdays[index]
    ) &&
    normalizedLeft.preferredDayTypes.length ===
      normalizedRight.preferredDayTypes.length &&
    normalizedLeft.preferredDayTypes.every(
      (value, index) => value === normalizedRight.preferredDayTypes[index]
    ) &&
    normalizedLeft.injuries.length === normalizedRight.injuries.length &&
    normalizedLeft.injuries.every(
      (value, index) => value === normalizedRight.injuries[index]
    ) &&
    areAppLogicSettingsEqual(normalizedLeft, normalizedRight)
  );
}
