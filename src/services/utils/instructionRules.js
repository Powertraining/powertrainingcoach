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
- Percentage-based plans must respect percentageReferenceMethod for deliberate max tests. multi_rm and true_1rm are scheduled assessments; rpe_based_1rm is used only as the temporary missing-Program-Max bridge.
- Missing Program Max: if a required primary lift has no Program Max in the user input or strengthAssessmentSummary, do not block the program and do not invent percentage loading. In Week 1, prescribe normal RPE-based loading for that lift only (no percentagePrescription) and include strengthAssessment.method "rpe_based_1rm" so the app can collect load, reps, and RPE from the logged set.
- Apply that automatic missing-max RPE bridge regardless of percentageReferenceMethod. percentageReferenceMethod controls deliberate calibration tests; it must not prevent a user from starting normal Week 1 training.
- If programMaxSetup is "calibration_week", use Week 1 as the optional calibration week instead: schedule safe primary-lift assessments using percentageReferenceMethod, then begin percentage prescriptions on later exposures. Never schedule a true 1RM calibration for a beginner or within 8 weeks of competition; fall back to multi_rm or rpe_based_1rm.
- Missing-max RPE estimate sets should use RPE 7–9 and 3–10 reps, with 3–5 reps preferred for main strength lifts. The app estimates 1RM by adding reps in reserve from RPE, then sets Program Max to 90% of estimated 1RM.
- Once strengthAssessmentSummary contains a Program Max/trainingMaxKg for that lift, treat the max as known and switch that lift to percentage-based loading from the next generated exposure.
- Known Program Max: if a Program Max is available for a primary lift, use percentage-based loading from the first generated exposure with no preamble or assessment session.
- Only main primary lifts (back squat, front squat, bench press, deadlift, overhead press, and similar) need a Program Max. Accessories, isolation exercises, plyos, throws, and conditioning never require one.
- multi_rm: prescribe a hard top set of 2–5 reps @RPE 9–10. Schedule every 4–6 weeks in off-season or early/mid camp. Block in the final 5 weeks before competition.
- true_1rm: rare; only for intermediate/advanced athletes confirmed to be in an off-season or general strength phase; never within 8 weeks of competition; max one true 1RM test per week across all lifts.
- Use stored training-max history when available and keep all assessments on primary lifts only.`,
  rpe_rationale: `# RPE adjustment rules
- For ordinary low-rep load adjustments, 1 RPE point is roughly a 2.5% load change.
- Use that rule for small same-rep-target load adjustments on monitored lifts, not for rpe_based_1rm strength-reference estimates.
- Do not turn RPE-based plans into RM tests or strength-reference assessments unless the athlete explicitly chose the percentage system.
- A reference set at the same rep target can move about plus or minus 2.5% for each RPE step while staying in the same strength zone.`,
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
  supplemental_exercise_intensity: `# Supplemental exercise intensity rules
- For neck, wrist/forearm, abs/trunk, and grip/carry/hold work, prescribe intensity mainly through RPE rather than percentage-based loading, even when the athlete selected the percentage system.
- Neck work: use RPE 5-8. Keep it especially controlled; never push toward the top of that range as a default.
- Wrist and forearm work: use RPE 6-8, also kept especially controlled given how sensitive these joints are to overload.
- Abs/trunk work: if the exercise is loadable, technically simple, and safe to load hard (e.g. weighted sit-ups, cable crunches, loaded carries used as core work), use RPE 7-9 and progress through added load or reps. If it is not loadable, or is more skill-dependent or unstable (e.g. rollouts, hanging leg raises, anti-rotation holds), use RPE 6-8 and progress through reps, hold time, or a harder variation instead of external load.
- Grip, carry, and hold work: use RPE 7-9 and progress through added load, hold or carry time, or distance.`,
  coaching_language: `# Coaching language and exercise description rules
- All exercise notes, coaching cues, and descriptions must be logical and specific to the exact exercise, rep scheme, intensity, and session purpose prescribed.
- Before writing any instruction, check that it is consistent with the programmed volume. An instruction that only makes sense for higher-rep or open-ended work must not appear on a low-rep set where it is physically impossible to apply.
  - Example of a contradiction to avoid: writing "stop the set if jump height drops" on a 3-rep squat jump set — there are not enough reps for quality to degrade meaningfully before the set ends.
  - Correct alternative: "Perform each rep with maximal intent. Reset briefly between reps and focus on full extension."
- Fatigue-monitoring cues (e.g. "stop if speed drops", "terminate when form breaks", "reduce load if output falls") are only appropriate for sets of 5 or more reps, conditioning blocks, AMRAP sets, or explicitly open-ended prescriptions where fatigue can actually accumulate within the set.
- Avoid vague, stylized, or filler phrases. Do not write language like "crisp release", "explode with elegance", "attack the ground", "unleash power", or similar constructions that sound unnatural, hype-driven, or generically AI-generated.
- Use simple, direct, coach-like language. Good examples: "Move explosively.", "Keep the landing soft and controlled.", "Reset between reps.", "Drive through the floor.", "Maintain a neutral spine."
- Match the tone to the training quality: strength sets get load-focused cues, power sets get speed and intent cues, accessory sets get position and feel cues, conditioning sets get pacing and output cues.
- Every sentence in a note or cue should pass this test: does this instruction make sense for this exact exercise, this exact rep scheme, and this exact training goal? If not, remove it or rewrite it.`,
  pull_ups_chin_ups: `# Pull-up and chin-up rules
- Pull-ups and chin-ups are always prescribed with RPE or RIR, even when the athlete chose percentage loading, because bodyweight already contributes heavily to the true load.
- Do not add percentagePrescription or strengthAssessment objects to pull-ups, chin-ups, assisted pull-ups, band-assisted pull-ups, eccentric pull-ups, weighted pull-ups, or lat pulldowns.
- If the athlete cannot perform clean bodyweight pull-ups, use assisted pull-ups, band-assisted pull-ups, eccentric pull-ups, or lat pulldowns for 3-4 x 5-8 @ RPE 7-8.
- If the athlete can perform 1-9 clean pull-ups, use bodyweight pull-ups and progress reps while stopping with 1-2 reps in reserve.
- If the athlete can perform 10+ clean pull-ups, weighted pull-ups become available. Use 3-5 x 3-6 @ RPE 7-9 and progress load only when all sets hit the top of the rep range at the target RPE.
- If max clean pull-up reps are not provided, do not assume the athlete qualifies for weighted pull-ups. Use trainingCapabilities.pullingWork conservatively: "no" means assisted pull-ups or lat pulldowns, "somewhat" means assisted or bodyweight work with reps in reserve, and "yes" means bodyweight progression unless the input shows 10+ clean reps.
- In camp or under high combat-sport load, reduce pull-up/chin-up work to 1-3 sets @ RPE 7-8.
- Key cues: clean reps only, no kicking, control the bottom, pull chest toward the bar, and stop the set before form breaks.
- Log bodyweight, added weight if used, reps per set, RPE/RIR, and grip variation.`,
  substitutes: `# Substitution rules
- Every exercise needs a substitutionOptions array so the app can swap in comparable variations.
- Add pragmatic substitutes for exercises that are technical, inconvenient, crowded, or equipment-sensitive.
- Keep every substitute in the same movement family and preserve the same training emphasis.
- If a substitute would change the quality too much, do not use it.`,
  plyometrics_loading_jumps: `# Plyometric and loaded-jump rules
- Start every athlete at the lowest impact tier allowed by experience, movement competency, recovery status, and program phase.
- Progress impact one tier at a time: low, then medium, then high. Regress if landing quality, recovery, or pain says to.
- Early phases favor lower-impact general plyos and medicine-ball work; later phases can move toward more reactive and sport-specific power if the athlete is ready.
- For back-squat jumps, trap-bar jumps, and similar loaded jumps, prescribe the total external load (bar plus plates) at roughly 30-60% of body mass for most fighters.
- Account for the empty implement: hex bars commonly weigh 20-25 kg and standard barbells about 20 kg. If the empty bar already exceeds the target load for a smaller athlete, prescribe a lighter bar or dumbbells and explicitly say so in the exercise notes.
- Keep every loaded jump crisp and full-effort. Do not solve poor output by loading heavier; excess load reduces flight time and degrades mechanics.
- When jump-height data from a contact mat/app or bar-velocity data from a linear position transducer (LPT) is available, use it to auto-regulate load and stop the set when output or mechanics drop. Without technology, use the athlete's feel and visible jump quality.
- Rep ranges should match the drill: extensive stiffness work such as pogos or ankle jumps can use 10-20 reps, low-hurdle hops or low box jumps 5-10, jumps for height or distance 3-6, and depth/shock jumps or loaded jumps 3-5. Very rarely prescribe fewer than 3 reps for a jump.`,
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
- Rarely prescribe fewer than 3 reps for a medicine-ball throw variation.
- Include prescription about rebound - low-, moderate- or non-bouncing`,
  superset_complexes: `# Superset and complex rules
- When weekly S&C frequency is low or session time is short, compress the session with low-interference supersets.
- Favor pairings such as push plus pull, lower-body strength plus upper accessory, and core plus grip or neck.
- If medicine-ball throws and plyometrics both appear in the same session, pair them together by default unless setup or safety clearly makes that worse.
- Avoid pairing two highly fatiguing lifts that meaningfully reduce output unless the plan explicitly wants a contrast method.`,
  movement_pattern_balance: `# Movement pattern balance rules
- Every balanced session should cover the four major movement patterns: lower-body force (squat or hinge), upper-body push/press, upper-body pull, and trunk/core.
- Do not omit push/press from a session unless the session is explicitly labelled as lower-body-only or pull-only by design in a multi-day split where another session covers the missing pattern that same week.
- For 1-day-per-week programs or sessions of 30 minutes or less, where time prevents four separate blocks, use one of these two strategies:
  - Superset strategy: pair the push and pull movements together (e.g. bench press / barbell row, overhead press / cable row) so both patterns fit within the time cap without adding total work time.
  - Alternating-week strategy: if pairing genuinely cannot work, give push-emphasis in odd weeks and pull-emphasis in even weeks, and note the alternation clearly in the session label or notes so the athlete understands the weekly balance.
- Lower-body force work (squat or hinge) should anchor the session unless the athlete has a documented lower-body limitation.
- Core work may be paired with a pull movement or placed at the end of the session; it should not be the reason push/press is cut.
- Apply this rule before trimming accessories: the last item removed should be an accessory, never the sole pressing or pulling movement in the session.`,
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
- For "strength_power_endurance", follow "hybridSessionStructure" (also mirrored at "enduranceTraining.sessionStructure"):
  - "separate_sessions": place dedicated endurance and strength/power on different training days. Do not append conditioning to a strength/power session. This is the default when the preference is missing.
  - "same_session": combine them only on the requested endurance exposures, keeping power first, then main strength, then endurance. Size the session to the athlete's duration limit and recovery capacity.
- Use "trainingCapabilities" to choose safe exercise categories. "yes" means the athlete can perform that category confidently, "somewhat" means use simpler progressions and coaching notes, and "no" means avoid that category or replace it with safer alternatives.
- If Olympic-lift variations, plyometrics, ballistic training, sprinting, or heavy bag work are marked "no", do not prescribe that category directly.
- Use "eventPreparation" as context for competitions or important dates the athlete is preparing for. If it includes dates or timelines, align the training arc pragmatically without inventing extra event details.
- Use "equipment" to choose exercises and substitutions that match the athlete's available setup.`,
  bodyweight_training: `# Bodyweight-only program rules
- When the program is bodyweight-only, do not use percentage-based loading or percentagePrescription objects. Progress through repetition ranges, total volume, exercise difficulty, and training density instead.
- For basic strength exercises (push-ups, squats, lunges, rows, dips, etc.), increase reps first within a target range, then add sets, then progress to a harder variation once the athlete consistently reaches the upper end of the rep range with good technique.
- For explosive bodyweight exercises (squat jumps, broad jumps, med-ball throws where no load applies, sprint drills, etc.), keep rep counts low enough to preserve speed, height, distance, and technical quality. Do not inflate reps to fill volume. Progress by improving execution, adding a small amount of volume, or advancing to a harder variation — not by chasing higher rep totals.
- Do not prescribe indefinitely increasing reps. Recognize the ceiling: once the athlete is consistently hitting high rep ranges (e.g. 20+ push-ups, 15+ pull-ups), performing the hardest practical variations with good form, or accumulating high total weekly volume, bodyweight-only loading is approaching its effective limit for strength and power development.
- At that ceiling, include a brief, educational, optional note in the plan — not a warning or a hard stop — that acknowledges the progress and suggests considering a weight-based program. Example wording: "You have progressed well with bodyweight-only training. To continue improving strength and power, a weight-based program may now be more effective." This note should appear in session notes or a plan-level summary, not as a prescribed exercise.
- This transition recommendation is especially relevant when the athlete's stated goal is maximal strength, explosive strength, power, or long-term athletic development.
- Never turn power or explosive exercises into conditioning work by inflating reps or adding fatigue-based instructions where quality is the goal. Match guidance to the training purpose at all times.`,
  session_duration_rules: `# Session duration rules
- Use "sessionDuration" and "sessionDurationMinutes" from the user input to size each training day.
- For finite durations, keep warm-up, main work, accessories, and conditioning realistic for that time cap.
- For 30 or 45 minute sessions, prioritize the highest-value work and trim lower-priority accessories. Always respect the movement-pattern balance rule before trimming: the sole push/press or pull movement in a session must not be removed. Use supersets to preserve both patterns without adding time.
- If "sessionDuration" is "no_time_limit" or "sessionDurationMinutes" is null, treat it as flexible but still pragmatic. Do not create marathon sessions, excessive exercise lists, 10-hour workouts, or unrealistic volumes. Prefer focused sessions that would usually fit within about 90-120 minutes.`,
  endurance_training: `# Endurance training rules
- Include dedicated endurance work only when desiredTraining is "endurance" or "strength_power_endurance", or when the athlete explicitly opted in with includeEnduranceTraining or enduranceTraining.include. If desiredTraining is "strength_power" and there is no explicit opt-in, keep conditioning minimal and supportive.
- Take the athlete's combat sport, trainingPhase, sportLoadLevel, combatTrainingIntensity, weekly S&C frequency, preferred weekdays, sessionDuration, injuries, equipment, selected modality, enduranceTraining.sessionsPerWeek, and enduranceTraining.preferredFormat into account before placing endurance.
- Start with the lowest number of endurance sessions needed. One to two sessions is enough for many combat athletes; three or more requires low enough sport load and stable recovery. Warn in notes if the selected frequency is high relative to combat load.
- In off-camp/off-season, endurance can build a broader aerobic base, work capacity, and specific weak links. In fight camp/in-camp, endurance must fit around sparring, pads, grappling, weight management, and freshness; prioritize specificity and reduce extra fatigue.
- When endurance is included, prescribe it as a clear exercise entry with an endurancePrescription object so the app can render the modality, format, duration, intensity, work/rest, rounds, and target.
- Available endurance modalities are running, sprinting, circuit_training, heavy_bag, swimming, assault_bike, rowing_ergometer, skiing_ergometer, arm_crank_machine, bicycling, versaclimber, and sport_specific.
- Running is best for accessible general aerobic work, especially off-camp, but avoid overusing it when lower-body fatigue, joint irritation, plyometric exposure, or combat load is high.
- Sprinting is best for acceleration, maximal-speed exposure, and repeated high-power efforts, but use it only when speed quality can stay high and the athlete has the tissue tolerance; avoid it under high fatigue or heavy explosive lower-body loading.
- Bicycling is useful for lower-impact aerobic volume, tempo work, and longer conditioning sessions when running impact is not ideal.
- Circuit training is best for local muscular endurance, repeated-effort capacity, grip/arm/trunk weak links, and blended work capacity. Keep it recoverable and avoid letting it interfere with key strength, power, sparring, or skill days.
- Heavy bag endurance is for strikers and is most useful when the athlete needs conditioning close to striking mechanics, local upper-body fatigue, flurry capacity, or fight-camp specificity. Do not prescribe direct heavy bag work if heavyBag capability is "no".
- Swimming is useful for low-impact aerobic or recovery-oriented conditioning when joints, legs, or the overall combat load need relief. Remember that poor swim skill can make the session technique-limited.
- Assault bike is a low-impact, easy-to-scale option for aerobic intervals, threshold work, hard intervals, repeated bursts, and mixed upper/lower-body conditioning.
- Rowing ergometer is useful for measurable total-body steady work, intervals, threshold efforts, and hard intervals without impact, but avoid excessive low-back or arm fatigue when technique is poor.
- Skiing ergometer is useful for upper-body and trunk-driven conditioning with low leg impact, especially for grapplers, hand-fighting transfer, or weeks with heavy running/kicking/leg fatigue.
- Arm crank machine is useful when lower-body loading should be avoided or when upper-body endurance is the target, especially for wrestlers, but it is usually targeted rather than the default modality.
- VersaClimber is useful for low-impact full-body climbing intervals when the athlete can tolerate combined upper-body, trunk, and leg drive.
- Sport-specific endurance is the match-prep alternative: use it when competition specificity matters most, and shape it around round length, density, technical quality, and the athlete's actual combat schedule.
- Non-circuit endurance must be classified as continuous_aerobic, aerobic_intervals, tempo_threshold, long_hiit, repeated_sprint_training, sprint_interval_training, recovery, or sport_specific_conditioning rather than generic conditioning.
- Continuous aerobic work is mainly for base, active recovery, or low-cost conditioning. Use easy-to-moderate RPE/talk-test guidance, often 20-45 minutes, and progress duration before pace/power.
- Aerobic intervals use longer controlled work bouts with incomplete easy recovery. Threshold/tempo work should use sustainable pace, split, speed, or power markers when available.
- High-intensity intervals must be separated by purpose: long_hiit for 1-4 minute hard aerobic intervals, repeated_sprint_training for very short repeat-burst work, and sprint_interval_training for 20-30 second all-out bouts with long recovery. Use the minimum effective dose.
- Sprinting is anaerobic only. Do not prescribe sprinting as steady aerobic, aerobic intervals, or recovery work. Speed/explosiveness uses about 10-20 m, repeat bursts about 20-40 m, and hard conditioning about 60-150 m. Stop or reduce volume when speed clearly drops, fatigue is high, or lower-body loading is already heavy.
- Circuit training must solve the athlete's stated fatigue problem, not merely generate a hard circuit. The earlier enduranceTraining.preferredFormat answer sets the energy-system format, work:rest family, and density; do not reinterpret or re-ask it from circuit focus.
- Combine all circuit inputs: primaryCombatSport sets the sport-relevant exercise pool, experience sets exercise complexity and round count, enduranceTraining.preferredFormat sets format and work:rest, and enduranceTraining.circuitTraining.focusMode plus regions set exercise-selection bias.
- When circuitTraining.focusMode is "specific_regions", put roughly 50-70% of total circuit work into the selected circuitTraining.regions and keep 30-50% as full-body work. Bias, never replace: a selected region must never produce a region-only circuit.
- The only circuit region values are grip_forearms, arms, shoulders, neck, upper_back, trunk, hips, and legs. Choose exercises that directly load the selected regions in sport-relevant ways; for example, grip_forearms can use hangs, carries, or rope pulls rather than a vague upper-body bias. Dynamic, isometric, or mixed work may be used according to the sport demand.
- When circuitTraining.focusMode is "whole_body", distribute exercise selection across the whole body and ignore any stale regional values. Never borrow visible exercise language or sport examples from another sport; use neutral language when sport-specific wording is unavailable.
- Circuit work:rest must come from the target, not a universal Tabata default. Local endurance often fits 30-60s work with 15-30s rest; general work capacity 20-60s work with 15-40s rest; repeated hard efforts 10-30s work with incomplete recovery; explosive repeatability needs longer rest such as 1:3 to 1:6. Use the least aggressive ratio that trains the quality.
- Circuit rounds should come from target total work, density, station count, exercise complexity, training age, and weekly fatigue. When combat or total weekly training load is high, reduce density first by using fewer rounds or longer rest; preserve the selected regional bias and exercise intent. Reduce rounds before increasing density if quality drops. Progress only one variable at a time: rounds, work duration, rest duration, exercise difficulty, or priority-area exposure.
- Heavy bag endurance is its own category. First identify the target: aerobic bag work, tempo/sustained conditioning, repeated-burst bag work, local upper-body endurance, or sport-specific fight-camp simulation. Do not make every bag endurance session maximal.
- Heavy bag aerobic/tempo sessions use longer, steadier rounds with technical control. Repeated-burst bag sessions use short hard bursts with enough rest to preserve output. The harder the conditioning, the simpler the combinations should be.
- Sport-specific fight-camp bag work should resemble the sport first, then be slightly harder through one controlled overload only: rest reduction, one extra round, surge windows, or output quotas. Do not increase round count, reduce rest, and raise intensity all at once.
- Place hard endurance away from heavy lower-body strength/power and important sparring when possible. If endurance and lifting must share a day, put the athlete's higher-priority quality first. Easy aerobic work is safest near strength work.
- Never stack hard endurance the day before important sparring if avoidable, and do not put the hardest endurance on the hardest sparring day unless intentionally using a high-low model.
- If the selected modality conflicts with injuries, equipment, sport demands, capability ratings, or weekly load, choose the closest safer allowed modality and explain briefly in the notes.`
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
  "supplemental_exercise_intensity",
  "coaching_language",
  "pull_ups_chin_ups",
  "substitutes",
  "plyometrics_loading_jumps",
  "bilateral",
  "unilateral",
  "ballistic_training",
  "superset_complexes",
  "movement_pattern_balance",
  "deload_unload",
  "session_spacing",
  "training_preference_rules",
  "bodyweight_training",
  "session_duration_rules",
  "endurance_training",
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

function isExplicitFalse(value) {
  return value === false || value === "false" || value === "no";
}

function isExplicitTrue(value) {
  return value === true || value === "true" || value === "yes";
}

function getEnduranceSettings(userInput = {}) {
  const nestedSettings =
    userInput?.enduranceTraining && typeof userInput.enduranceTraining === "object"
      ? userInput.enduranceTraining
      : userInput?.endurancePreferences && typeof userInput.endurancePreferences === "object"
        ? userInput.endurancePreferences
        : {};

  return {
    include:
      userInput?.includeEnduranceTraining ??
      userInput?.enduranceTrainingIncluded ??
      nestedSettings.include ??
      nestedSettings.includeEnduranceTraining,
    modality:
      userInput?.enduranceModality ??
      userInput?.preferredEnduranceModality ??
      nestedSettings.modality ??
      nestedSettings.preferredModality,
    modalities:
      userInput?.enduranceModalities ??
      userInput?.preferredEnduranceModalities ??
      nestedSettings.modalities ??
      nestedSettings.preferredModalities,
  };
}

function hasSelectedEnduranceModality(userInput = {}) {
  const enduranceSettings = getEnduranceSettings(userInput);

  return (
    normalizeString(enduranceSettings.modality) ||
    (Array.isArray(enduranceSettings.modalities) &&
      enduranceSettings.modalities.some((entry) => normalizeString(entry)))
  );
}

function shouldIncludeEnduranceRules(userInput = {}) {
  const desiredTraining = normalizeString(userInput?.desiredTraining).toLowerCase();
  const enduranceSettings = getEnduranceSettings(userInput);

  if (isExplicitFalse(enduranceSettings.include)) {
    return false;
  }

  return (
    desiredTraining === "endurance" ||
    desiredTraining === "strength_power_endurance" ||
    isExplicitTrue(enduranceSettings.include) ||
    hasSelectedEnduranceModality(userInput)
  );
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
    "supplemental_exercise_intensity",
    "pull_ups_chin_ups",
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

  if (shouldIncludeEnduranceRules(userInput)) {
    selectedKeys.add("endurance_training");
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
