// Note: In React Native/Expo, we cannot use the ?raw import syntax (Vite/webpack feature)
// Instead, we rely on Firebase liveInstructions or minimal local fallbacks

// Minimal local instruction fallbacks for use when Firebase is unavailable
const local_general = `# General Rules
You are a specialist performance coach that designs tailored strength, power, speed, and conditioning programs for combat-sport athletes.`;

const local_reps = `# Reps and Intensity
Follow progressive overload principles with appropriate rep ranges based on training goals.`;

const local_compound = `# Compound Lifts
Focus on fundamental movement patterns: squat, hinge, push, pull, and carry variations.`;

const local_plyo = `# Plyometrics and Loading
Progress from lower intensity to higher intensity movements following proper periodization.`;

const local_ballistic = `# Ballistic Training
Apply explosive training methods with adequate recovery between high-intensity efforts.`;

const local_substitutes = `# Substitutes
For somewhat complex, inconvenient, or hard-to-access exercises, always provide pragmatic substitutes that stay in the same movement category and training emphasis. Do not swap to unrelated patterns. For example: High Back Squat -> Front Squat / Low Bar Back Squat / Safety Bar Squat. Bench Press -> DB Bench Press / Narrow Grip Bench Press / Weighted Dips. Power Clean -> Power Snatch.`;

const instructionPriority = [
    "general_rules",
    "reps_intensity",
    "compound_lifts",
    "plyometrics_loading_jumps",
    "ballistic_training",
    "substitutes"
];

/**
 * Builds the complete system prompt for generating training programs.
 * * @param {object} userInput - Clean structured input from frontend.
 * @param {object} oldPlan - Previous training plan for progression (if any).
 * @param {object} liveInstructions - Object containing instructions fetched from Firebase (optional).
 * @returns {string} - The complete prompt string.
 */
export function buildTrainingPrompt(userInput, oldPlan = null, liveInstructions = null) {
    const fallbackInstructions = {
        general_rules: local_general,
        reps_intensity: local_reps,
        compound_lifts: local_compound,
        plyometrics_loading_jumps: local_plyo,
        ballistic_training: local_ballistic,
        substitutes: local_substitutes
    };

    const liveInstructionEntries = Object.entries(liveInstructions || {}).filter(
        ([, text]) => typeof text === "string" && text.trim().length > 0
    );

    const orderedLiveInstructions = liveInstructionEntries.sort(([leftKey], [rightKey]) => {
        const leftPriority = instructionPriority.indexOf(leftKey);
        const rightPriority = instructionPriority.indexOf(rightKey);

        if (leftPriority !== -1 || rightPriority !== -1) {
            if (leftPriority === -1) return 1;
            if (rightPriority === -1) return -1;
            return leftPriority - rightPriority;
        }

        return leftKey.localeCompare(rightKey);
    });

    const mergedInstructions = new Map(orderedLiveInstructions);

    Object.entries(fallbackInstructions).forEach(([key, value]) => {
        if (!mergedInstructions.has(key)) {
            mergedInstructions.set(key, value);
        }
    });

    const guidelines = Array.from(mergedInstructions.values())
        .filter(text => text && typeof text === 'string') 
        .join("\n\n");

    const instructionImages = Array.isArray(liveInstructions?.__images)
        ? liveInstructions.__images.filter((image) => image?.url && image?.name)
        : [];

    const imageInstructions = instructionImages.length > 0
        ? `
Additional reference images are attached separately and are part of the instruction set. Use them when relevant:
${instructionImages.map((image) => `- ${image.name}`).join("\n")}
`
        : "";

    const substitutionSchemaInstructions = `
### EXERCISE SUBSTITUTION RULES:
- Apply the substitutes.md logic, but encode substitute ideas directly in each exercise's "substitutionOptions" array so the app can render them as selectable replacements.
- Every exercise MUST include "substitutionOptions". Use an empty array when no pragmatic alternatives are needed.
- For exercises that are somewhat complex, inconvenient, or commonly inaccessible, include 2-5 pragmatic substitute options.
- Keep every substitute in the same movement category and training emphasis. Never swap to an unrelated pattern.
- Good examples:
  - High Back Squat -> Front Squat / Low Bar Back Squat / Safety Bar Squat
  - Bench Press -> DB Bench Press / Narrow Grip Bench Press / Weighted Dips
  - Power Clean -> Power Snatch
- Every substitution option must be a full exercise object with "name", "sets", "reps", "notes", and "videoUrl".
`;

    // Combine everything into the final prompt
    const prompt = `
You are **PowerTrainingCoach**, an expert AI specializing in creating safe, effective, and personalized strength & conditioning training programs for combat athletes.

Follow ALL of the domain rules and instructions below:
Given two equivalent exercises, prioritize the exercise that is easier to perform with proper form and technique, especially for athletes with limited training experience or mobility constraints. Always prioritize safety and proper movement patterns over complexity or intensity.

${guidelines}
${imageInstructions}
${substitutionSchemaInstructions}

---

### USER INPUT (JSON):
${JSON.stringify(userInput, null, 2)}

---

### OUTPUT INSTRUCTIONS:
- Respond ONLY in valid JSON.
- Follow the structure below EXACTLY.
- Do not include commentary or explanation.
- Every exercise MUST include a valid "videoUrl".
- Every exercise MUST include a "substitutionOptions" array.

{
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": "3–5",
              "reps": "8–12",
              "notes": "Short instruction or coaching cue",
              "substitutionOptions": [
                {
                  "name": "Comparable Alternative",
                  "sets": "3–5",
                  "reps": "8–12",
                  "notes": "Short instruction or coaching cue",
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

### Previous Plan (if any):
${oldPlan ? JSON.stringify(oldPlan, null, 2) : "No previous plan provided."}

---

###

Now generate the training plan JSON.
`;

    return prompt;
}
