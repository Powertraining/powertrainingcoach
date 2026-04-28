import {
  DEFAULT_TRAINING_CYCLE_WEEKS,
  getWeeksUntilEvent,
} from "./trainingCycle.js";

const EMBEDDED_INSTRUCTION_RULES = Object.freeze({
  general_rules: `# General rules
- Coach combat-sport athletes with phased S&C that fits skill, sparring, recovery, and event timing.
- Build plans fast, make pragmatic assumptions when data is missing, and keep explanations brief and coach-like.
- Bias the session flow toward power first, then main strength, then accessories, then conditioning.
- Respect interference with sport practice, keep neck and grip in safe brief doses, and use conservative safety guidance around pain, acute injury, and weight cutting.
- Scale lifting volume down when combat load is high while keeping quality and intent high.`,
  cycle_rules: `# Cycle structure rules
- Default to a 12-week parent cycle unless the athlete is preparing for an event sooner than that, then shorten the cycle to fit the real timeline.
- Break longer cycles into 4-week checkpoints so the plan can be reviewed and adjusted at Weeks 4 and 8 instead of waiting until the end.
- Use weekly autoregulation for load, reps, and conditioning dose inside the block.
- End the cycle with a real rebuild: summarize progress, keep what is working, and expect updated athlete input before the next parent cycle is generated.`,
  sport_specific_rules: `# Sport-specific priority rules
- Grappling sports prioritize strength and power first, then speed.
- Striking sports prioritize speed first late in camp, while still keeping enough strength and power to support it.
- MMA stays between those buckets and should keep a balanced strength-power-speed blend.
- Match the phase emphasis to the sport so the athlete peaks in the quality that matters most.`,
  striking_sports: `# Striking-sport camp rules
- For boxing, kickboxing, and Muay Thai, distinguish off-camp from in-camp.
- Off-camp means no confirmed competition inside the peak window. Prioritize general athletic development: build strength first, then power, while keeping some speed work present without forcing a speed peak.
- In-camp means a confirmed competition exists inside the peak window. Back-plan from the event date and shift the final phase toward a speed-dominant peak.
- "Peak for pure speed" means peak in emphasis, not exclusive training. In striking fight camp, preserve minimum effective doses of strength and power so the athlete does not lose force qualities.
- Reduce volume before intensity in the taper. In the final 7-10 days, reduce volume roughly 30-60% while keeping intensity, intent, and movement speed high.
- Use this striking periodization logic: off-camp raises the force ceiling, early camp builds and converts, mid camp converts strength to power, late camp expresses speed, and fight week prioritizes freshness and sharpness.
- Far from the fight, train what the athlete lacks. Close to the fight, train what the athlete must express.
- Late-camp work should ask whether the exercise makes the athlete faster and sharper or just more tired. Reduce or remove work that adds fatigue without improving speed expression.
- Lower load in late camp does not mean low effort: lighter strength-speed, speed-strength, ballistic, plyometric, and medicine-ball work should move violently fast with maximal concentric intent.
- Progress striking power work from general to more specific as competition nears: general jumps and throws early, then more lateral, rotational, elastic, reactive, and strike-specific outputs later.
- Boxing can bias late specific power toward skater jumps, rotational throws, med-ball punch throws, reactive hops, and bag speed bursts. Muay Thai and kickboxing can bias toward scissor jumps, split-squat jumps, single-leg bounds, rotational throws, and explosive kick bursts.
- Combat-sport load controls lifting volume in camp: when pads, sparring, bag work, footwork, roadwork, clinch, or weight management are high, trim S&C volume before chasing more fitness.`,
  reps_intensity: `# Presentation and clarity rules
- Make every prescription explicit and readable: no question marks, vague loading, or missing set-rep-intensity details.
- Number exercises in order and label supersets clearly with 1a, 1b, 2a, 2b, and so on.`,
  general_strength_training_logic: `# Strength loading rules
- Respect the selected loadingStrategy on primary lifts and keep the pattern recognizable across the whole block.
- Flat loading is the default for beginners and keeps the same main work prescription across sets.
- Ascending, descending, and double pyramids must look deliberate, not random.
- When reps and intensity both change, either keep relative difficulty similar across sets or make the later sets clearly harder.
- Keep the scheme stable inside a block and only rotate it at block boundaries or after a failed deload plus repeated stall signals.
- Use weekly mini check-ins for load and volume adjustments, and end-of-block check-ins for real scheme changes.`,
  percentage_system: `# Percentage-system rules
- Use percentagePrescription only on primary lifts where a 1RM-style reference makes sense.
- Percentage-based working sets must show both percent1RM and relativeIntensity for rep targets from 1-10 using the standard rep-max table.
- If reps fall outside 1-10, keep percent1RM and omit relativeIntensity instead of inventing one.
- Accessories, most rows, RDL-style secondary work, isolation lifts, and stability drills stay on RPE, RIR, feel, time, or quality-based notes even if the athlete selected percentage loading.`,
  rm_attempts: `# Strength-reference rules
- Percentage-based plans must respect percentageReferenceMethod.
- heavy_single is the default and lowest-fatigue option: embed a single @RPE 8-9 as a normal-session top set, usually once per loading block, never in deload weeks, and soften or remove it near competition.
- multi_rm uses a hard top set of 2-5 reps, updates 1RM with Epley, and should usually appear every 4-6 weeks in off-season or early camp, not in the final 3-4 weeks before competition.
- true_1rm is rare, only for experienced athletes in off-camp general-strength phases, never close to competition, and never more than one true 1RM test in a week.
- Use stored training-max history when available and keep all assessments on primary lifts only.`,
  rpe_rationale: `# RPE adjustment rules
- In low-rep strength work, 1 RPE point is roughly a 2.5% load change.
- Use that rule for 1-5 rep top sets and small RPE-based load adjustments on monitored lifts.
- Do not turn RPE-based plans into RM tests or heavy-single strength assessments unless the athlete explicitly chose the percentage system.
- A reference set at the same rep target can move about plus or minus 2.5% per RPE point while staying in the same strength zone.`,
  missed_rep: `# Missed-rep rules
- When a monitored lift has a missed rep, ask why: too heavy, pain/irritation, or technical error.
- In RPE-based plans, treat a missed rep as an overshoot: lower load about 2.5-5%, keep the rep target, and avoid automatic scheme changes.
- In percentage-based plans, offer small load drops of about 2.5%, 5%, or 7.5%; freeze next-week progression unless the miss was clearly technical.
- Pain-related misses should stop the lift and move toward a pain-free variation before changing the broader program.
- Olympic-lift misses may be technical; after one technical miss lower load and retry only if sharp, after two misses stop and use a simpler pull, shrug, or throw.
- Ballistic, plyometric, and speed work should log quality drop rather than force missed-rep progression logic; reduce reps, extend rest, or stop when quality drops.
- Accessories should stay simple: end the set, reduce load or reps slightly, and repeat until completed cleanly.
- Repeated misses on the same lift should freeze progression or lower the training max slightly before any full scheme change.`,
  close_grip_bench_press: `# Close-grip bench press reference rule
- Only apply this when the athlete selected the percentage system.
- If close-grip bench press is programmed and no specific close-grip max exists, estimate it as 95% of the normal bench press 1RM.
- Make it clear that close-grip percentages are based on that estimated close-grip reference, not the regular bench press max.`,
  compound_lifts: `# Compound-lift selection rules
- Favor fundamental squat, hinge, push, pull, carry, and similar compound patterns.
- For boxing, kickboxing, and Muay Thai, skip conventional deadlift-style main lifts unless the user clearly asked for them.
- For striking sports, prefer trap-bar jumps, clean pulls, or clean high pulls as explosive hinge options, while RDLs stay fine as accessories.`,
  accessory_exercises: `# Accessory exercise rules
- Main horizontal pull slots should default to productive weighted rows such as barbell, chest-supported, cable, T-bar, or one-arm dumbbell rows.
- Band rows, face pulls, and similar low-load pulls stay in accessory, prehab, or warm-up slots unless equipment is extremely limited or the athlete is in rehab.
- Main core slots should default to high-stimulus trunk work such as rollouts, strict leg raises, weighted sit-ups, cable crunches, carries, or heavy anti-rotation work.
- Low-load motor-control drills such as dead bugs or bird dogs belong in warm-ups, rehab, or deload maintenance, not as the only real core work in a normal week.
- Keep accessories practical: heavier secondary lifts use RPE, small isolation work uses RPE or feel, and rehab or activation drills use quality-based notes rather than fake percentage precision.
- Use concrete exercise names for neck work rather than vague movement-pattern labels.`,
  substitutes: `# Substitution rules
- Every exercise needs a substitutionOptions array so the app can swap in comparable variations.
- Add pragmatic substitutes for exercises that are technical, inconvenient, crowded, or equipment-sensitive.
- Keep every substitute in the same movement family and preserve the same training emphasis.
- If a substitute would change the quality too much, do not use it.`,
  plyometrics_loading_jumps: `# Plyometric and loaded-jump rules
- Start every athlete at the lowest impact tier allowed by experience, movement competency, recovery status, and program phase.
- Progress impact one tier at a time: low, then medium, then high. Regress if landing quality, recovery, or pain says to.
- Early phases favor lower-impact general plyos and medicine-ball work; later phases can move toward more reactive and sport-specific power if the athlete is ready.
- Loaded jumps should usually use roughly 30-60% of body mass as external load and stay crisp rather than grindy.
- Rep ranges should match the drill: pogos and extensive stiffness work can go higher, most jumps for height or distance sit around 3-6, and depth or loaded jumps usually stay around 3-5.`,
  bilateral: `# Bilateral plyometric impact guide
- Treat CMJs, squat jumps, pogos, box jumps, and simple line hops as low impact.
- Broad jumps, tuck jumps, split-squat jumps, low-box drop jumps, and similar rebound drills are medium impact.
- Repeated broad jumps, rebound depth jumps, and high hurdle jumps are high impact.
- Use this guide when selecting or progressing bilateral plyometrics.`,
  unilateral: `# Unilateral plyometric impact guide
- Single-leg pogos, hop-to-stick drills, skater hops, and low single-leg box jumps start around medium impact.
- Repeated same-leg hops, bounds, single-leg broad jumps, single-leg hurdle hops, step-off rebounds, and single-leg depth jumps count as high impact.
- Unilateral prescriptions must clearly show both sides, for example 3 x 5+5 rather than 3 x 5.`,
  ballistic_training: `# Ballistic and medicine-ball rules
- Keep ballistic work explosive, high quality, and well rested.
- Medicine-ball throw reps should be pragmatic rather than ultra-low: usually 3-10 reps depending on the throw.
- Chest passes can use the higher end, while rotational punches or hip throws usually sit around 3-5 per side.
- Rarely prescribe fewer than 3 reps for a medicine-ball throw variation.`,
  superset_complexes: `# Superset and complex rules
- When weekly S&C frequency is low or session time is short, compress the session with low-interference supersets.
- Favor pairings such as push plus pull, lower-body strength plus upper accessory, and core plus grip or neck.
- If medicine-ball throws and plyometrics both appear in the same session, pair them together by default unless setup or safety clearly makes that worse.
- Avoid pairing two highly fatiguing lifts that meaningfully reduce output unless the plan explicitly wants a contrast method.`,
  deload_unload: `# Deload rules
- Plans should support two deload styles and pick the one that matches readiness.
- Option 1: maintain intensity while reducing volume by about 30-50% when the athlete still handles load well but needs fatigue relief.
- Option 2: maintain more of the session structure while dropping load, usually about 5-10%, when heavy work feels slow, painful, or unusually hard.
- In both styles, cut fatigue without losing the movement pattern or the phase purpose.`,
  session_spacing: `# Session-spacing rules
- Keep the program session-based, then use preferred weekdays as secondary guidance.
- Estimate overlap from session region, training quality, and stress level rather than exercise names alone.
- When two sessions strongly overlap in region and force, power, or fatigue demands, aim for about 48 hours between them when practical.
- This rule is advisory, not absolute.`,
  missed_session_logic: `# Missed-session rules
- Preserve weekly structure first, session order second, and the main stimulus third.
- Rescue missed work inside the same week only when there is room; do not stack two full missed sessions together.
- If only one slot remains, trim the session from the bottom while protecting the highest-value work.
- Rescue priority is power, plyo, and med-ball first, then the main compound lift, then the main weighted row or pull, then high-stimulus core, with accessories sacrificed first.
- Near competition, replace catch-up volume with a short primer. After illness or a heavily disrupted week, use a conservative re-entry session and often repeat the week instead of forcing progression.`,
  training_preference_rules: `# Training preference rules
- "experience" is the athlete's strength-and-conditioning experience level, not combat-sport rank.
- Use "desiredTraining" to choose the plan emphasis:
  - "strength_power": prioritize strength, power, speed, and explosive qualities with only enough conditioning to support the work.
  - "endurance": prioritize conditioning and endurance while keeping strength/power work minimal and supportive.
  - "strength_power_endurance": combine strength/power and endurance in a balanced, recoverable way.
- Use "trainingCapabilities" to choose safe exercise categories. "yes" means the athlete can perform that category confidently, "somewhat" means use simpler progressions and coaching notes, and "no" means avoid that category or replace it with safer alternatives.
- If Olympic-lift variations, plyometrics, ballistic training, sprinting, or heavy bag work are marked "no", do not prescribe that category directly.
- Use "eventPreparation" as context for competitions or important dates the athlete is preparing for. If it includes dates or timelines, align the training arc pragmatically without inventing extra event details.
- Use "equipment" to choose exercises and substitutions that match the athlete's available setup.`,
  session_duration_rules: `# Session duration rules
- Use "sessionDuration" and "sessionDurationMinutes" from the user input to size each training day.
- For finite durations, keep warm-up, main work, accessories, and conditioning realistic for that time cap.
- For 30 or 45 minute sessions, prioritize the highest-value work and trim lower-priority accessories.
- If "sessionDuration" is "no_time_limit" or "sessionDurationMinutes" is null, treat it as flexible but still pragmatic. Do not create marathon sessions, excessive exercise lists, 10-hour workouts, or unrealistic volumes. Prefer focused sessions that would usually fit within about 90-120 minutes.`
});

export const EMBEDDED_INSTRUCTION_ORDER = Object.freeze([
  "general_rules",
  "cycle_rules",
  "sport_specific_rules",
  "striking_sports",
  "reps_intensity",
  "general_strength_training_logic",
  "percentage_system",
  "rm_attempts",
  "rpe_rationale",
  "missed_rep",
  "close_grip_bench_press",
  "compound_lifts",
  "accessory_exercises",
  "substitutes",
  "plyometrics_loading_jumps",
  "bilateral",
  "unilateral",
  "ballistic_training",
  "superset_complexes",
  "deload_unload",
  "session_spacing",
  "training_preference_rules",
  "session_duration_rules",
  "missed_session_logic",
]);

const STRIKING_SPORT_NAMES = new Set([
  "boxing",
  "kickboxing",
  "muay thai",
  "muay thai / kickboxing",
]);

const STRIKING_CAMP_TYPES = Object.freeze({
  offCamp: "off_camp",
  inCamp: "in_camp",
});

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function parsePositiveInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function isStrikingSport(userInput = {}) {
  const normalizedSport = normalizeString(userInput?.primaryCombatSport).toLowerCase();
  return STRIKING_SPORT_NAMES.has(normalizedSport);
}

function getStrikingEventText(userInput = {}) {
  return (
    normalizeString(userInput?.competitionTimeline) ||
    normalizeString(userInput?.eventPreparation)
  );
}

export function getStrikingCampContext(userInput = {}, today = new Date()) {
  if (!isStrikingSport(userInput)) {
    return null;
  }

  const eventText = getStrikingEventText(userInput);
  const weeksUntilEvent = getWeeksUntilEvent(eventText, today);
  const peakWindowWeeks = DEFAULT_TRAINING_CYCLE_WEEKS;
  const generatedPlanWeeks =
    parsePositiveInteger(userInput?.numWeeks) || DEFAULT_TRAINING_CYCLE_WEEKS;
  const hasCompetitionInsidePeakWindow =
    Number.isFinite(weeksUntilEvent) && weeksUntilEvent <= peakWindowWeeks;
  const hasUserMarkedInCamp =
    normalizeString(userInput?.trainingPhase).toLowerCase() === "in_camp";
  const hasUnparsedInCampTimeline =
    hasUserMarkedInCamp && Boolean(eventText) && !Number.isFinite(weeksUntilEvent);
  const campType =
    hasCompetitionInsidePeakWindow || hasUnparsedInCampTimeline
      ? STRIKING_CAMP_TYPES.inCamp
      : STRIKING_CAMP_TYPES.offCamp;

  return {
    campType,
    eventText,
    weeksUntilEvent,
    peakWindowWeeks,
    generatedPlanWeeks,
    hasCompetitionInsidePeakWindow,
    shouldTaperInGeneratedPlan:
      campType === STRIKING_CAMP_TYPES.inCamp &&
      Number.isFinite(weeksUntilEvent) &&
      weeksUntilEvent <= generatedPlanWeeks,
  };
}

function buildStrikingCampContextText(userInput = {}, today = new Date()) {
  const context = getStrikingCampContext(userInput, today);

  if (!context) {
    return "";
  }

  if (context.campType === STRIKING_CAMP_TYPES.inCamp) {
    const eventDetail = Number.isFinite(context.weeksUntilEvent)
      ? `The confirmed striking competition is about ${context.weeksUntilEvent} week(s) away, inside the ${context.peakWindowWeeks}-week peak window.`
      : "The athlete marked an in-camp striking timeline, but the exact event date is not parseable.";
    const taperDetail = context.shouldTaperInGeneratedPlan
      ? "Include the speed-dominant final phase and the final 7-10 day taper inside this generated plan."
      : "Do not run the final taper yet if the event falls beyond this generated plan; use the appropriate early/mid-camp build toward the event.";

    return `# Resolved striking camp context
- Status: In-camp.
- ${eventDetail}
- This resolved status takes precedence over raw trainingPhase or competitionPeriod labels if they conflict.
- Back-plan from the event date. Make the final phase speed-dominant in emphasis, not exclusive, while preserving minimum effective strength and power doses.
- ${taperDetail}
- In the final 7-10 days before the competition, reduce volume roughly 30-60% before reducing intensity, and keep intensity, intent, and speed high.`;
  }

  const eventDetail = Number.isFinite(context.weeksUntilEvent)
    ? `The known event is about ${context.weeksUntilEvent} week(s) away, outside the ${context.peakWindowWeeks}-week peak window.`
    : "No confirmed competition inside the peak window is available.";

  return `# Resolved striking camp context
- Status: Off-camp.
- ${eventDetail}
- This resolved status takes precedence over raw trainingPhase or competitionPeriod labels if they conflict.
- Program for general strength, power, and speed with a build-focused emphasis.
- Do not force a speed peak or pure-speed final phase without a confirmed competition inside the peak window.`;
}

function shouldIncludePercentageRules(userInput = {}) {
  return normalizeString(userInput?.liftIntensityMethod, "percentage") === "percentage";
}

function buildSelectedInstructionKeys(userInput = {}, purpose = "plan") {
  const selectedKeys = new Set([
    "general_rules",
    "cycle_rules",
    "sport_specific_rules",
    "reps_intensity",
    "general_strength_training_logic",
    "rpe_rationale",
    "missed_rep",
    "compound_lifts",
    "accessory_exercises",
    "substitutes",
    "plyometrics_loading_jumps",
    "bilateral",
    "unilateral",
    "ballistic_training",
    "superset_complexes",
    "deload_unload",
    "session_spacing",
    "training_preference_rules",
    "session_duration_rules",
  ]);

  if (shouldIncludePercentageRules(userInput)) {
    selectedKeys.add("percentage_system");
    selectedKeys.add("rm_attempts");
    selectedKeys.add("close_grip_bench_press");
  }

  if (isStrikingSport(userInput)) {
    selectedKeys.add("striking_sports");
  }

  if (purpose === "missed_session") {
    selectedKeys.add("missed_session_logic");
  }

  return EMBEDDED_INSTRUCTION_ORDER.filter((key) => selectedKeys.has(key));
}

export function getFallbackInstructions() {
  return EMBEDDED_INSTRUCTION_RULES;
}

export function getEmbeddedInstructionKeys(userInput = {}, purpose = "plan") {
  return buildSelectedInstructionKeys(userInput, purpose);
}

export function getGuidelinesText({
  userInput = {},
  purpose = "plan",
  today = new Date(),
} = {}) {
  const selectedKeys = buildSelectedInstructionKeys(userInput, purpose);
  const guidelineBlocks = selectedKeys
    .map((key) => normalizeString(EMBEDDED_INSTRUCTION_RULES[key]))
    .filter(Boolean);
  const strikingCampContext = buildStrikingCampContextText(userInput, today);

  if (strikingCampContext) {
    guidelineBlocks.push(strikingCampContext);
  }

  return guidelineBlocks.join("\n\n");
}
