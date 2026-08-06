// Static execution guides sourced from the Master Doc Exercise Guide.
// Shown in the "Tips" sheet when the user taps "?" next to an exercise.

export const EXERCISE_GUIDES = [
    // Lower-Body Plyometrics
    {
        name: "Pogo Jumps",
        description:
            "Stand tall, feet hip-width. Bounce rapidly from the ankles with almost straight knees. Keep contacts short and stiff, like a spring.",
        focus: "ankle stiffness, elastic bounce.",
        avoid: "deep knee bend, collapsing arches.",
    },
    {
        name: "Low Ankle Hops",
        description:
            "Similar to pogos, but slightly lower and faster. Stay relaxed through the shoulders and bounce quietly.",
        focus: "rhythm and foot stiffness.",
        avoid: "trying to jump high.",
    },
    {
        name: "Countermovement Jump",
        description:
            "Stand tall. Dip quickly by bending hips and knees, then jump as high as possible. Land softly and reset.",
        focus: "maximal vertical power.",
        avoid: "slow dip, knees caving in.",
    },
    {
        name: "Squat Jump",
        description:
            "Start in a quarter- or half-squat position. Pause briefly, remove the countermovement, then jump straight up.",
        focus: "starting strength and concentric power.",
        avoid: "bouncing before the jump.",
    },
    {
        name: "Tuck Jump",
        description: "Jump vertically and pull knees toward the chest. Land and repeat directly.",
        focus: "explosive jump with body control.",
        avoid: "rushing reps or landing with stiff knees.",
    },
    {
        name: "Broad Jump",
        description:
            "Dip quickly, swing arms, and jump forward as far as possible. Land with both feet, absorb through hips and knees.",
        focus: "horizontal power.",
        avoid: "falling forward after landing.",
    },
    {
        name: "Standing Triple Jump",
        description:
            "Perform three explosive forward jumps in a row, usually two-foot to two-foot or alternating. Stick the final landing.",
        focus: "repeated horizontal power.",
        avoid: "turning it into sloppy bounding.",
    },
    {
        name: "Box Jump",
        description:
            "Jump onto a box with maximal intent. Land softly in a strong athletic position. Step down, don't jump down.",
        focus: "explosive takeoff, safe landing.",
        avoid: "choosing a box so high that you just tuck your knees.",
    },
    {
        name: "Hurdle Jump",
        description:
            "Jump over a low hurdle, land quickly, and either reset or rebound into the next jump.",
        focus: "reactive vertical power.",
        avoid: "hurdles too high, slow ground contact.",
    },
    {
        name: "Repeated Hurdle Jumps",
        description: "Set several low hurdles in a line. Jump over each one with short, quick contacts.",
        focus: "stiffness, rhythm, reactivity.",
        avoid: "pausing between hurdles unless intentionally programmed.",
    },
    {
        name: "Drop Landing",
        description: "Step off a box, land quietly, and hold the landing position.",
        focus: "landing mechanics and force absorption.",
        avoid: "jumping off the box; step off.",
    },
    {
        name: "Depth Jump",
        description: "Step off a box, land, then immediately jump upward as explosively as possible.",
        focus: "reactive strength.",
        avoid: "using a box that is too high or sinking too deep on landing.",
    },
    {
        name: "Drop Jump",
        description:
            "Step off a box, hit the ground, and rebound vertically with the shortest possible contact time.",
        focus: "very fast stretch-shortening cycle.",
        avoid: "deep knee bend; this should be quick and springy.",
    },
    {
        name: "Lateral Bound",
        description:
            "Push off one leg and jump sideways onto the other leg. Stick the landing or rebound depending on the goal.",
        focus: "lateral power and hip control.",
        avoid: "knee collapsing inward on landing.",
    },
    {
        name: "Skater Jump",
        description:
            "Same as lateral bound, but usually lower and more rhythmic. Swing the free leg behind the body like a speed skater.",
        focus: "side-to-side athletic control.",
        avoid: "twisting the torso excessively.",
    },
    {
        name: "Single-Leg Hop",
        description: "Stand on one leg. Hop forward, upward, or sideways and land on the same leg.",
        focus: "unilateral stiffness and control.",
        avoid: "letting the knee cave or foot wobble.",
    },
    {
        name: "Single-Leg Bounds",
        description: "Explode from one leg to the other in a running-like pattern. Cover distance while staying controlled.",
        focus: "sprint-like elastic power.",
        avoid: "overstriding and heavy landings.",
    },
    {
        name: "Alternating Bounds",
        description: "Drive one knee up, push hard through the ground, and alternate legs with each bound.",
        focus: "horizontal projection and sprint mechanics.",
        avoid: "reaching forward with the foot.",
    },
    {
        name: "Power Skips",
        description: "Skip explosively, driving the knee and opposite arm upward. Push through the ground aggressively.",
        focus: "sprint rhythm and vertical force.",
        avoid: "lazy, low-intensity skipping.",
    },
    {
        name: "Split Squat Jump",
        description: "Start in a lunge/split squat. Jump vertically and land in the same stance.",
        focus: "unilateral leg power.",
        avoid: "front knee drifting inward.",
    },
    {
        name: "Alternating Lunge Jump",
        description: "Start in a lunge, jump, switch legs in the air, and land in the opposite lunge.",
        focus: "repeated unilateral power.",
        avoid: "turning it into conditioning.",
    },
    {
        name: "Scissor Jump",
        description:
            "Similar to alternating lunge jumps, but with a faster, sharper leg switch and usually less depth.",
        focus: "quick leg exchange.",
        avoid: "excessive landing depth.",
    },
    {
        name: "Jump Squat",
        description: "Hold light load or use bodyweight. Dip and jump vertically. Land controlled and reset.",
        focus: "lower-body power.",
        avoid: "heavy loading that slows the jump.",
    },
    {
        name: "Trap Bar Jump",
        description: "Use a light trap bar load. Dip slightly, jump explosively, land balanced, reset.",
        focus: "loaded power.",
        avoid: "turning it into a slow strength lift.",
    },
    {
        name: "Bounding Uphill",
        description: "Bound up a slight hill with powerful knee drive and aggressive ground contact.",
        focus: "horizontal power with reduced landing stress.",
        avoid: "hill too steep, causing slow contacts.",
    },

    // Upper-Body Plyometrics
    {
        name: "Plyometric Push-Up",
        description: "Lower into a push-up, then push explosively so the hands leave the floor. Land with soft elbows.",
        focus: "upper-body power.",
        avoid: "sagging hips or crashing into the floor.",
    },
    {
        name: "Clap Push-Up",
        description: "Same as plyometric push-up, but clap in the air before landing.",
        focus: "explosive pressing.",
        avoid: "forcing the clap if power is not there.",
    },
    {
        name: "Depth Push-Up",
        description: "Start with hands elevated on blocks. Drop hands to the floor, absorb, then push explosively.",
        focus: "reactive upper-body power.",
        avoid: "excessive drop height.",
    },
    {
        name: "Medicine Ball Chest Pass",
        description: "Hold med ball at chest. Explosively pass it forward against a wall or to a partner.",
        focus: "horizontal pressing power.",
        avoid: "slow wind-up or pushing with only the arms.",
    },
    {
        name: "Medicine Ball Overhead Throw",
        description: "Hold med ball overhead. Throw it forward or down using the whole body.",
        focus: "total-body extension.",
        avoid: "making it only an arm throw.",
    },
    {
        name: "Medicine Ball Slam",
        description: "Raise ball overhead, extend tall, then slam it hard into the floor.",
        focus: "aggressive trunk and upper-body power.",
        avoid: "rounding the back excessively.",
    },
    {
        name: "Medicine Ball Scoop Toss",
        description: "Hold ball low near the hips. Drive through the legs and hips, then throw forward or upward.",
        focus: "hip extension and lower-to-upper transfer.",
        avoid: "muscling it with the arms.",
    },
    {
        name: "Rotational Medicine Ball Throw",
        description: "Stand side-on to a wall. Rotate through hips and trunk, then throw the ball into the wall.",
        focus: "rotational power.",
        avoid: "only twisting the shoulders.",
    },
    {
        name: "Shot-Put Medicine Ball Throw",
        description: "Hold ball near one shoulder. Drive from the legs and hips, then punch/throw the ball forward.",
        focus: "unilateral pressing and rotational power.",
        avoid: "standing still and arm-pushing.",
    },
    {
        name: "Kneeling Medicine Ball Chest Pass",
        description: "Kneel tall, brace the trunk, and throw the ball explosively from the chest.",
        focus: "upper-body power without leg contribution.",
        avoid: "leaning too far forward.",
    },
    {
        name: "Tall-Kneeling Overhead Slam",
        description: "Kneel tall, lift the ball overhead, and slam down violently while keeping trunk control.",
        focus: "trunk and upper-body power.",
        avoid: "collapsing through the hips.",
    },

    // Sprint/Running-Based Plyometrics
    {
        name: "A-Skips",
        description: "Skip forward with high knee drive, dorsiflexed foot, and active ground strike under the hips.",
        focus: "sprint rhythm and front-side mechanics.",
        avoid: "reaching in front of the body.",
    },
    {
        name: "B-Skips",
        description: "Drive the knee up, extend the leg slightly, then pull the foot down and back under the body.",
        focus: "active ground strike.",
        avoid: "kicking forward passively.",
    },
    {
        name: "Straight-Leg Bounds",
        description: "Run forward with mostly straight legs, striking the ground under the hips with stiff contacts.",
        focus: "hamstring stiffness and front-side mechanics.",
        avoid: "overstriding.",
    },
    {
        name: "Sprint Bounds",
        description: "Use exaggerated sprint strides with powerful knee drive and long, elastic contacts.",
        focus: "sprint-specific power.",
        avoid: "floating too long or landing heavily.",
    },

    // Squat Patterns
    {
        name: "Back Squat (Low-Bar)",
        description:
            "Place the bar lower across the rear delts, not on the neck. Brace hard, hinge slightly at the hips, sit down and back, then drive up by pushing the floor away and keeping the hips and chest rising together.",
        focus: "strong brace, hip drive, total-body tension.",
        avoid: "turning it into a good morning, losing upper-back tightness, knees collapsing.",
    },
    {
        name: "Back Squat (High-Bar)",
        description:
            "Place the bar high on the traps, just below the neck. Brace hard, keep the torso relatively upright, squat down between the knees, then drive straight up through the midfoot.",
        focus: "upright posture, quad drive, clean depth.",
        avoid: "elbows dropping, chest collapsing, knees caving in.",
        aliases: ["Back Squat", "Barbell Back Squat", "Barbell Squat"],
    },
    {
        name: "Front Squat",
        description: "Hold the bar on the front shoulders in the clavicle region with elbows high. Brace, squat down upright, then drive through the midfoot.",
        focus: "upright torso, strong quads, clean brace.",
        avoid: "elbows dropping, upper back rounding.",
    },
    {
        name: "Goblet Squat",
        description: "Hold a dumbbell or kettlebell at chest height. Squat down between the knees, stay tall, and drive up smoothly.",
        focus: "clean squat pattern and control.",
        avoid: "collapsing forward or relaxing at the bottom.",
    },
    {
        name: "Box Squat",
        description:
            "Sit back to a box with control (don't anticipate it being there), keep tension, pause, then drive up aggressively. Don't lose bracing.",
        focus: "hip control and consistent depth.",
        avoid: "rocking back, relaxing fully on the box.",
    },
    {
        name: "Zercher Squat",
        description: "Hold the bar in the crooks of the elbows. Brace hard, keep the torso tall, squat down, then drive up.",
        focus: "trunk strength and leg drive.",
        avoid: "rounding forward or letting the bar pull you down.",
    },
    {
        name: "Overhead Squat",
        description: "Hold the bar overhead with locked arms. Keep ribs down, shoulders active, and squat under control.",
        focus: "mobility, stability, total-body control.",
        avoid: "rushing, losing overhead position.",
    },

    // Deadlift / Hinge Patterns
    {
        name: "Conventional Deadlift",
        description: "Stand with the bar over midfoot. Brace, hinge down, grip the bar, push the floor away, and stand tall.",
        focus: "full-body tension and leg drive from the floor.",
        avoid: "yanking the bar, rounded back, hips rising too early.",
        aliases: ["Deadlift"],
    },
    {
        name: "Sumo Deadlift",
        description: "Take a wide stance with toes turned out. Brace, push knees out, keep chest tall, and drive through the floor.",
        focus: "leg drive and hip position.",
        avoid: "knees collapsing inward, starting too far from the bar.",
    },
    {
        name: "Trap Bar Deadlift",
        description: "Stand centered in the trap bar. Brace, keep chest up, push the floor away, and finish tall.",
        focus: "strong leg drive with a neutral torso.",
        avoid: "squatting too low or shrugging at the top.",
    },
    {
        name: "Romanian Deadlift",
        description: "Start standing tall. Push hips back, keep a soft knee bend, lower until hamstrings stretch, then drive hips forward.",
        focus: "hamstrings, glutes, controlled hinge.",
        avoid: "rounding the back or turning it into a squat.",
    },
    {
        name: "Stiff-Leg Deadlift",
        description: "Keep the knees only slightly bent. Hinge from the hips, lower under control, then stand by driving the hips through.",
        focus: "posterior-chain tension.",
        avoid: "chasing depth by rounding the spine.",
    },
    {
        name: "Good Morning",
        description: "Place the bar on the upper back. Brace, push hips back, keep the torso rigid, then return by extending the hips.",
        focus: "hinge strength and spinal control.",
        avoid: "bending from the lower back.",
    },
    {
        name: "Hip Thrust",
        description: "Place upper back on a bench and feet flat. Drive hips up until the body forms a straight line, squeeze glutes, then lower.",
        focus: "powerful hip extension.",
        avoid: "overextending the lower back.",
    },
    {
        name: "Barbell Glute Bridge",
        description: "Lie on the floor with bar over hips. Drive through the heels, lift hips, squeeze glutes, then lower with control.",
        focus: "glute drive and hip extension.",
        avoid: "flaring ribs or arching the lower back.",
    },

    // Single-Leg / Split-Stance Patterns
    {
        name: "Split Squat",
        description: "Start in a split stance. Lower straight down, keep front knee tracking over toes, then drive through the front leg.",
        focus: "single-leg strength and control.",
        avoid: "pushing mostly from the back leg.",
    },
    {
        name: "Bulgarian Split Squat",
        description: "Place rear foot on a bench. Lower under control, keep torso stable, then drive up through the front leg.",
        focus: "unilateral leg strength.",
        avoid: "bouncing at the bottom or letting the front knee cave.",
    },
    {
        name: "Forward Lunge",
        description: "Step forward, lower into the lunge, push back to the start position.",
        focus: "deceleration and leg control.",
        avoid: "stepping too narrow or crashing into the front leg.",
    },
    {
        name: "Reverse Lunge",
        description: "Step backward, lower under control, then pull yourself back up with the front leg.",
        focus: "controlled single-leg strength.",
        avoid: "pushing off excessively with the back foot.",
    },
    {
        name: "Walking Lunge",
        description: "Step forward into each lunge, lower smoothly, then drive into the next step.",
        focus: "rhythm, control, leg endurance.",
        avoid: "rushing or letting posture collapse.",
    },
    {
        name: "Lateral Lunge",
        description: "Step sideways, sit into the working hip, keep the other leg straighter, then push back to center.",
        focus: "frontal-plane leg strength.",
        avoid: "knee collapsing inward or torso folding.",
    },
    {
        name: "Step-Up",
        description: "Place one foot fully on a box or bench. Drive through that leg to stand tall, then lower under control.",
        focus: "single-leg drive.",
        avoid: "bouncing off the floor leg.",
    },
    {
        name: "Cossack Squat",
        description: "Shift into one leg while the other stays extended. Keep the chest up, move slowly, and stand back through the working leg.",
        focus: "lateral strength and mobility.",
        avoid: "forcing depth without control.",
    },

    // Upper-Body Push
    {
        name: "Bench Press",
        description: "Set shoulder blades back and down. Lower the bar under control to the chest, then press up hard.",
        focus: "stable upper back, strong press.",
        avoid: "bouncing the bar or losing shoulder position.",
    },
    {
        name: "Close-Grip Bench Press",
        description: "Use a narrower grip. Keep elbows closer to the body, lower with control, and press hard.",
        focus: "triceps and pressing strength.",
        avoid: "grip too narrow or wrists collapsing.",
        aliases: ["Close Grip Bench"],
    },
    {
        name: "Incline Bench Press",
        description: "Set the bench at an incline. Lower the bar to the upper chest, keep shoulders stable, then press up.",
        focus: "upper chest and shoulder pressing strength.",
        avoid: "flaring elbows excessively.",
    },
    {
        name: "Dumbbell Bench Press",
        description: "Lower dumbbells under control with elbows slightly tucked. Press up and in without losing shoulder position.",
        focus: "balanced pressing strength.",
        avoid: "excessive range that pulls shoulders forward.",
    },
    {
        name: "Push-Up",
        description: "Keep body straight from head to heels. Lower chest toward the floor, then push the floor away hard.",
        focus: "full-body tension and pressing control.",
        avoid: "sagging hips or flared elbows.",
    },
    {
        name: "Dip",
        description: "Support yourself on parallel bars. Lower under control, keep shoulders stable, then press back up.",
        focus: "chest, triceps, shoulder strength.",
        avoid: "dropping too deep or shrugging shoulders.",
    },
    {
        name: "Overhead Press",
        description: "Start with the bar at shoulder height. Brace, press overhead, move head slightly through at the top.",
        focus: "strict vertical pressing.",
        avoid: "leaning back excessively.",
        aliases: ["Standing Military Press"],
    },
    {
        name: "Dumbbell Shoulder Press",
        description: "Start dumbbells at shoulder height. Brace, press overhead, and control the lowering phase.",
        focus: "shoulder strength and stability.",
        avoid: "arching the back to finish reps.",
    },
    {
        name: "Push Press",
        description:
            "Start with the bar on the front shoulders, elbows slightly in front of the bar. Brace hard, dip straight down a few inches, then drive violently through the legs and transfer that force into the bar. Finish by pressing to a strong overhead lockout.",
        focus: "leg drive into upper-body power.",
        avoid: "turning the dip into a squat.",
    },
    {
        name: "Landmine Press",
        description: "Hold the end of the bar at shoulder height. Brace, press forward and upward, then lower under control.",
        focus: "shoulder-friendly pressing strength.",
        avoid: "rotating or leaning excessively.",
    },

    // Upper-Body Pull
    {
        name: "Pull-Up",
        description:
            "Start from a full hang. Brace the trunk, pull the elbows down toward the ribs, and bring the chest toward the bar. Lower under control until the arms are fully extended.",
        focus: "vertical pulling strength.",
        avoid: "kicking, swinging, or half reps.",
    },
    {
        name: "Chin-Up",
        description: "Use an underhand grip. Pull yourself up by driving elbows down and back, then lower until dead-hang and repeat.",
        focus: "lats and biceps with full control.",
        avoid: "craning the neck to reach the bar.",
    },
    {
        name: "Lat Pulldown",
        description: "Grip the bar, lean slightly back, pull to upper chest, then control the return.",
        focus: "strong lat contraction.",
        avoid: "pulling behind the neck or using momentum.",
    },
    {
        name: "Barbell Row",
        description: "Hinge forward with a braced torso. Pull the bar toward the lower ribs, then lower under control.",
        focus: "upper-back strength and trunk stiffness.",
        avoid: "turning it into a hip thrust.",
        aliases: ["Bent Over Rows"],
    },
    {
        name: "Pendlay Row",
        description: "Start each rep from the floor. Brace, pull explosively to the torso, then return the bar to the floor.",
        focus: "explosive upper-back pulling.",
        avoid: "losing back position between reps.",
    },
    {
        name: "Dumbbell Row",
        description: "Support one hand or hinge freely. Pull the dumbbell toward the hip, squeeze, then lower fully.",
        focus: "lat and upper-back strength.",
        avoid: "twisting the torso too much.",
    },
    {
        name: "Chest-Supported Row",
        description: "Lie chest-down on an incline bench or machine. Pull elbows back, squeeze, then lower under control.",
        focus: "upper back without lower-back strain.",
        avoid: "shrugging every rep.",
    },
    {
        name: "Seated Cable Row",
        description: "Sit tall, brace, pull handle toward the torso, then return with control.",
        focus: "controlled horizontal pulling.",
        avoid: "leaning back to move the weight.",
        aliases: ["Cable Row"],
    },
    {
        name: "T-Bar Row",
        description: "Brace over the handle. Pull toward the torso, keep elbows driving back, then lower smoothly.",
        focus: "heavy upper-back strength.",
        avoid: "standing too upright or jerking.",
        aliases: ["Landmine Row"],
    },
    {
        name: "Inverted Row",
        description: "Hang under a bar with body straight. Pull chest to bar, keep hips up, then lower under control.",
        focus: "bodyweight pulling strength.",
        avoid: "sagging hips or shortening range.",
    },

    // Olympic Lift Variations / Explosive Compounds
    {
        name: "Power Clean",
        description:
            "Start with the bar over midfoot. Push through the floor, keep the bar close, extend hard through the hips, knees, and ankles, then pull under and catch on the shoulders as high as you can.",
        focus: "violent hip extension and fast catch.",
        avoid: "curling the bar with the arms.",
    },
    {
        name: "Hang Power Clean",
        description:
            "Start from the hang with the bar close to the thighs. Dip by loading the hips, drive violently upward, keep the bar close, then pull under and catch on the shoulders as high as you can.",
        focus: "explosive hip drive from the hang.",
        avoid: "slow extension or lazy catch.",
        aliases: ["Hang Clean"],
    },
    {
        name: "Clean Pull",
        description: "Start like a clean. Push through the floor, keep the bar close, extend powerfully through the legs and hips, and finish tall without catching the bar.",
        focus: "maximal pulling power.",
        avoid: "bending the arms too early.",
    },
    {
        name: "Power Snatch",
        description: "Start with a wide grip and the bar over midfoot. Push through the floor, keep the bar close, extend hard, then pull under and catch overhead in a quarter squat.",
        focus: "speed, timing, overhead stability.",
        avoid: "pressing the bar out overhead.",
    },
    {
        name: "Hang Power Snatch",
        description: "Start from the hang with a wide grip. Load the hips, drive upward violently, keep the bar close, then pull under and catch overhead in a quarter squat.",
        focus: "explosive extension and fast turnover.",
        avoid: "swinging the bar away from the body.",
        aliases: ["Hang Snatch"],
    },
    {
        name: "Snatch Pull",
        description: "Start like a snatch. Push through the floor, keep the bar close, extend powerfully, and finish tall without pulling under.",
        focus: "explosive vertical pull.",
        avoid: "leaning back excessively at the top.",
    },
    {
        name: "Push Jerk",
        description: "Start with the bar on the front shoulders. Dip straight down, drive the bar upward with the legs, then quickly re-bend the knees and catch overhead with locked arms.",
        focus: "leg drive and fast re-bend.",
        avoid: "pressing it slowly overhead.",
    },
    {
        name: "Split Jerk",
        description:
            "Start with the bar on the front shoulders. Dip straight down, drive hard with the legs, then split the feet and catch overhead with locked arms. Recover front foot first, then back foot.",
        focus: "maximal overhead power and stability.",
        avoid: "soft lockout or unstable footwork.",
    },
    {
        name: "Thruster",
        description: "Start in the front rack. Squat down, drive up aggressively, and use the leg drive to send the bar directly into an overhead press.",
        focus: "leg drive into pressing.",
        avoid: "separating it into a slow squat plus slow press.",
    },
];

function normalizeExerciseGuideKey(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[()]/g, " ")
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function singularizeKey(key) {
    const words = key.split(" ");
    const lastWord = words[words.length - 1];
    if (lastWord.length > 1 && lastWord.endsWith("s") && !lastWord.endsWith("ss")) {
        words[words.length - 1] = lastWord.slice(0, -1);
        return words.join(" ");
    }
    return null;
}

const EXERCISE_GUIDES_BY_KEY = new Map();
EXERCISE_GUIDES.forEach((guide) => {
    const keys = [guide.name, ...(guide.aliases || [])];
    keys.forEach((name) => {
        EXERCISE_GUIDES_BY_KEY.set(normalizeExerciseGuideKey(name), guide);
    });
});

export function getExerciseGuide(exerciseName) {
    const key = normalizeExerciseGuideKey(exerciseName);
    if (!key) return null;
    if (EXERCISE_GUIDES_BY_KEY.has(key)) {
        return EXERCISE_GUIDES_BY_KEY.get(key);
    }
    const singularKey = singularizeKey(key);
    if (singularKey && EXERCISE_GUIDES_BY_KEY.has(singularKey)) {
        return EXERCISE_GUIDES_BY_KEY.get(singularKey);
    }
    return null;
}
