import { execFile } from "node:child_process";
import { createHash, createSign } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { OPENAI_PLAN_GENERATION_MODEL, OPENAI_API_TEMPERATURE } from "../src/services/config/apiConfig.js";
import { buildTrainingPrompt } from "../src/services/utils/promptBuilder.js";
import { getEmbeddedInstructionKeys } from "../src/services/utils/instructionRules.js";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const DEFAULT_GCP_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
  "power-training-coach";
const DEFAULT_SECRET_NAME = "OPENAI_API_KEY";
const DEFAULT_SECRET_VERSION = "latest";
const SECRET_MANAGER_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const METADATA_TOKEN_URL =
  "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SECRET_MANAGER_BASE_URL = "https://secretmanager.googleapis.com/v1";

const SPORT_OPTIONS = Object.freeze([
  "Boxing",
  "Wrestling",
  "BJJ",
  "Muay Thai / Kickboxing",
  "Judo",
  "MMA",
]);

const SESSIONS_PER_WEEK_OPTIONS = Object.freeze([1, 2, 3, 4, 5]);
const DESIRED_TRAINING_OPTIONS = Object.freeze([
  "strength_power",
  "endurance",
  "strength_power_endurance",
]);
const SESSION_DURATION_OPTIONS = Object.freeze([
  "30_min",
  "45_min",
  "60_min",
  "75_min",
  "90_min",
  "no_time_limit",
]);
const EXPERIENCE_OPTIONS = Object.freeze(["beginner", "intermediate", "advanced"]);
const PRIMARY_STYLE_OPTIONS = Object.freeze(["balanced", "striking", "grappling", "clinching"]);

// Only test styles that are meaningful for each sport.
// Grappling-only sports (Wrestling, BJJ) don't have striking or clinching.
// Striking-only sports (Boxing, Muay Thai) don't have grappling.
// Judo is clinch-and-throw so striking doesn't apply.
// MMA is mixed so all styles apply.
const VALID_STYLES_BY_SPORT = Object.freeze({
  Boxing: ["balanced", "striking", "clinching"],
  Wrestling: ["balanced", "grappling"],
  BJJ: ["balanced", "grappling"],
  "Muay Thai / Kickboxing": ["balanced", "striking", "clinching"],
  Judo: ["balanced", "grappling", "clinching"],
  MMA: ["balanced", "striking", "grappling", "clinching"],
});
const COMPETITION_PERIOD_OPTIONS = Object.freeze([
  "off_season",
  "pre_season",
  "fight_camp",
  "in_season",
]);
const EQUIPMENT_OPTIONS = Object.freeze(["full_gym", "home_minimal", "bodyweight_only"]);
const FOCUS_EMPHASIS_OPTIONS = Object.freeze([
  "mixed",
  "more_sparring",
  "more_conditioning",
]);

const DEFAULT_SPORT_WEIGHT_CLASS = Object.freeze({
  Boxing: "Lightweight",
  Wrestling: "74 kg",
  BJJ: "Medium Heavy",
  "Muay Thai / Kickboxing": "70 kg",
  Judo: "-81 kg",
  MMA: "Featherweight",
});

const DEFAULT_OPTIONS = Object.freeze({
  outputDir: path.resolve(projectRoot, "test/trainingPlans"),
  instructionsDir: path.resolve(projectRoot, "docs/instructions"),
  run: false,
  overwrite: false,
  includeImages: false,
  limit: null,
  casesPerSport: 100,
  sports: SPORT_OPTIONS,
  concurrency: 1,
  instructionsSource: "local",
  model: OPENAI_PLAN_GENERATION_MODEL,
  temperature: toNumber(OPENAI_API_TEMPERATURE, 1),
  numWeeks: 12,
  trainingPlanBatch: 1,
  gcpProjectId: DEFAULT_GCP_PROJECT_ID,
  secretName: DEFAULT_SECRET_NAME,
  secretVersion: DEFAULT_SECRET_VERSION,
});

function printHelp() {
  console.log(`
Usage:
  node scripts/simulateTrainingPlans.js [options]

Options:
  --run                      Call the OpenAI API. Without this flag the script only writes a manifest.
  --overwrite                Regenerate cases even when a successful output file already exists.
  --include-images           Attach local instruction images as data URLs.
  --limit <n>                Only process the first n cases globally (overrides --cases-per-sport for quick testing).
  --cases-per-sport <n>      Maximum cases per sport. Default: ${DEFAULT_OPTIONS.casesPerSport}.
  --sport <name[,name]>      Restrict the run to one or more sports.
  --concurrency <n>          Number of concurrent API calls when --run is used. Default: 1.
  --model <name>             Override the OpenAI model. Default: ${DEFAULT_OPTIONS.model}.
  --temperature <number>     Override temperature. Default: ${DEFAULT_OPTIONS.temperature}.
  --num-weeks <n>            Value written into the request payload. Default: ${DEFAULT_OPTIONS.numWeeks}.
                             Session duration cycles through: ${SESSION_DURATION_OPTIONS.join(", ")}.
                             Desired training options: ${DESIRED_TRAINING_OPTIONS.join(", ")}.
  --batch <n>                Training plan batch number. Default: ${DEFAULT_OPTIONS.trainingPlanBatch}.
  --output-dir <path>        Output directory. Default: test/trainingPlans
  --instructions-dir <path>  Override the local instructions directory.
  --gcp-project <id>         Google Cloud project for Secret Manager. Default: ${DEFAULT_OPTIONS.gcpProjectId}.
  --secret-name <name>       Secret Manager secret name. Default: ${DEFAULT_OPTIONS.secretName}.
  --secret-version <name>    Secret Manager version. Default: ${DEFAULT_OPTIONS.secretVersion}.
  --instructions-source <mode>
                             "local" reads docs/instructions/*.md, "fallback" uses promptBuilder fallbacks.
  --help                     Show this message.

API key resolution (--run only):
  The script resolves OPENAI_API_KEY in this order:
    1. OPENAI_API_KEY environment variable (or functions/.secret.local loaded via --env-file-if-exists)
    2. firebase functions:secrets:access  (uses your "firebase login" session — same credential as deployment)
    3. gcloud secrets versions access     (fallback if gcloud is available)
    4. GCP Secret Manager REST API        (fallback for service-account or GCP VM environments)

Examples:
  node scripts/simulateTrainingPlans.js
  node scripts/simulateTrainingPlans.js --run --limit 10
  node scripts/simulateTrainingPlans.js --run --sport Boxing,MMA --concurrency 2
`);
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requireOptionValue(flag, value) {
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function parseArgs(argv) {
  const options = {...DEFAULT_OPTIONS};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }

    if (arg === "--run") {
      options.run = true;
      continue;
    }

    if (arg === "--overwrite") {
      options.overwrite = true;
      continue;
    }

    if (arg === "--include-images") {
      options.includeImages = true;
      continue;
    }

    const [flag, inlineValue] = arg.split("=", 2);
    const nextValue =
      inlineValue !== undefined ? inlineValue : argv[index + 1];

    switch (flag) {
      case "--limit":
        options.limit = parsePositiveInteger(
          requireOptionValue(flag, nextValue),
          null
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--cases-per-sport":
        options.casesPerSport = parsePositiveInteger(
          requireOptionValue(flag, nextValue),
          options.casesPerSport
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--sport":
        options.sports = normalizeSports(
          requireOptionValue(flag, nextValue)
            .split(",")
            .map((sport) => sport.trim())
            .filter(Boolean)
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--concurrency":
        options.concurrency = parsePositiveInteger(
          requireOptionValue(flag, nextValue),
          1
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--model":
        options.model = requireOptionValue(flag, nextValue);
        if (inlineValue === undefined) index += 1;
        break;
      case "--temperature":
        options.temperature = toNumber(
          requireOptionValue(flag, nextValue),
          options.temperature
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--num-weeks":
        options.numWeeks = parsePositiveInteger(
          requireOptionValue(flag, nextValue),
          options.numWeeks
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--batch":
        options.trainingPlanBatch = parsePositiveInteger(
          requireOptionValue(flag, nextValue),
          options.trainingPlanBatch
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--output-dir":
        options.outputDir = path.resolve(
          projectRoot,
          requireOptionValue(flag, nextValue)
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--instructions-dir":
        options.instructionsDir = path.resolve(
          projectRoot,
          requireOptionValue(flag, nextValue)
        );
        if (inlineValue === undefined) index += 1;
        break;
      case "--gcp-project":
        options.gcpProjectId = requireOptionValue(flag, nextValue);
        if (inlineValue === undefined) index += 1;
        break;
      case "--secret-name":
        options.secretName = requireOptionValue(flag, nextValue);
        if (inlineValue === undefined) index += 1;
        break;
      case "--secret-version":
        options.secretVersion = requireOptionValue(flag, nextValue);
        if (inlineValue === undefined) index += 1;
        break;
      case "--instructions-source":
        options.instructionsSource =
          requireOptionValue(flag, nextValue) === "fallback" ? "fallback" : "local";
        if (inlineValue === undefined) index += 1;
        break;
      default:
        if (flag.startsWith("--")) {
          throw new Error(`Unknown flag: ${flag}`);
        }
        break;
    }
  }

  return options;
}

function normalizeSports(requestedSports) {
  if (!Array.isArray(requestedSports) || requestedSports.length === 0) {
    return SPORT_OPTIONS;
  }

  const bySlug = new Map(
    SPORT_OPTIONS.map((sport) => [slugify(sport), sport])
  );
  const byExactName = new Map(
    SPORT_OPTIONS.map((sport) => [sport.toLowerCase(), sport])
  );

  const normalized = requestedSports.map((sport) => {
    const exactMatch = byExactName.get(String(sport).toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }

    const slugMatch = bySlug.get(slugify(String(sport)));
    if (slugMatch) {
      return slugMatch;
    }

    throw new Error(
      `Unsupported sport "${sport}". Expected one of: ${SPORT_OPTIONS.join(", ")}`
    );
  });

  return Array.from(new Set(normalized));
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toPosixRelativePath(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function buildScenarioInput({
  primaryCombatSport,
  sessionsPerWeek,
  desiredTraining,
  experience,
  primaryStyle,
  competitionPeriod,
  equipment,
  focusEmphasis,
  sessionDuration,
  numWeeks,
  trainingPlanBatch,
}) {
  return {
    primaryCombatSport,
    sessionsPerWeek,
    daysPerWeek: sessionsPerWeek,
    desiredTraining,
    experience,
    weightClass: DEFAULT_SPORT_WEIGHT_CLASS[primaryCombatSport] || "",
    primaryStyle,
    competitionPeriod,
    equipment,
    injuries: [],
    focusEmphasis,
    preferences: [focusEmphasis],
    sessionDuration: sessionDuration || "60_min",
    numWeeks,
    trainingPlanBatch,
  };
}

function buildCaseId(input) {
  return [
    slugify(input.primaryCombatSport),
    `freq-${input.sessionsPerWeek}`,
    `training-${slugify(input.desiredTraining)}`,
    `exp-${slugify(input.experience)}`,
    `style-${slugify(input.primaryStyle)}`,
    `period-${slugify(input.competitionPeriod)}`,
    `equipment-${slugify(input.equipment)}`,
    `focus-${slugify(input.focusEmphasis)}`,
  ].join("__");
}

function buildScenarioMatrix(options) {
  const scenarios = [];
  let globalSequence = 0;

  for (const primaryCombatSport of options.sports) {
    const sportSlug = slugify(primaryCombatSport);
    const validStyles = VALID_STYLES_BY_SPORT[primaryCombatSport] || PRIMARY_STYLE_OPTIONS;
    const sportScenarios = [];
    let sportSequence = 0;

    // Enumerate the four highest-impact dimensions so every combination of
    // experience, desiredTraining, competitionPeriod, and equipment is covered.
    // Lower-impact dimensions (primaryStyle, sessionsPerWeek, focusEmphasis)
    // cycle round-robin so all values appear across the 108 rows.
    for (const experience of EXPERIENCE_OPTIONS) {
      for (const desiredTraining of DESIRED_TRAINING_OPTIONS) {
        for (const competitionPeriod of COMPETITION_PERIOD_OPTIONS) {
          for (const equipment of EQUIPMENT_OPTIONS) {
            const primaryStyle = validStyles[sportSequence % validStyles.length];
            const sessionsPerWeek = SESSIONS_PER_WEEK_OPTIONS[sportSequence % SESSIONS_PER_WEEK_OPTIONS.length];
            const focusEmphasis = FOCUS_EMPHASIS_OPTIONS[sportSequence % FOCUS_EMPHASIS_OPTIONS.length];
            const sessionDuration = SESSION_DURATION_OPTIONS[globalSequence % SESSION_DURATION_OPTIONS.length];

            const input = buildScenarioInput({
              primaryCombatSport,
              sessionsPerWeek,
              desiredTraining,
              experience,
              primaryStyle,
              competitionPeriod,
              equipment,
              focusEmphasis,
              sessionDuration,
              numWeeks: options.numWeeks,
              trainingPlanBatch: options.trainingPlanBatch,
            });

            const caseId = buildCaseId(input);
            const successOutputPath = path.resolve(
              options.outputDir,
              "plans",
              sportSlug,
              `${caseId}.json`
            );
            const errorOutputPath = path.resolve(
              options.outputDir,
              "errors",
              sportSlug,
              `${caseId}.json`
            );

            sportScenarios.push({
              sequence: globalSequence + 1,
              caseId,
              sportSlug,
              successOutputPath,
              errorOutputPath,
              input,
            });
            sportSequence += 1;
            globalSequence += 1;
          }
        }
      }
    }

    const perSportLimit = options.casesPerSport;
    scenarios.push(...(perSportLimit ? sportScenarios.slice(0, perSportLimit) : sportScenarios));
  }

  return options.limit ? scenarios.slice(0, options.limit) : scenarios;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(filePath) {
  if (!(await pathExists(filePath))) {
    return null;
  }

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), {recursive: true});
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function toBase64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function buildServiceAccountJwt({clientEmail, privateKey, tokenUrl, scope}) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const unsignedToken = [
    toBase64Url(
      JSON.stringify({
        alg: "RS256",
        typ: "JWT",
      })
    ),
    toBase64Url(
      JSON.stringify({
        iss: clientEmail,
        scope,
        aud: tokenUrl,
        iat: nowInSeconds,
        exp: nowInSeconds + 3600,
      })
    ),
  ].join(".");

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  return `${unsignedToken}.${signer.sign(privateKey).toString("base64url")}`;
}

async function fetchJson(url, requestInit = {}, timeoutMs = 5000) {
  const response = await fetch(url, {
    ...requestInit,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const responseText = await response.text();
  const responseJson = responseText ? JSON.parse(responseText) : null;

  if (!response.ok) {
    throw new Error(
      responseJson?.error?.message ||
        responseJson?.error_description ||
        `Request failed (${response.status})`
    );
  }

  return responseJson;
}

async function loadServiceAccountCredentials() {
  const inlineJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  const base64Json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (base64Json) {
    return JSON.parse(Buffer.from(base64Json, "base64").toString("utf8"));
  }

  const configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (configuredPath && (await pathExists(configuredPath))) {
    return readJsonFile(configuredPath);
  }

  const repoLocalPath = path.resolve(projectRoot, "serviceAccountKey.json");
  if (await pathExists(repoLocalPath)) {
    return readJsonFile(repoLocalPath);
  }

  return null;
}

async function getMetadataAccessToken() {
  try {
    const result = await fetchJson(
      METADATA_TOKEN_URL,
      {
        headers: {
          "Metadata-Flavor": "Google",
        },
      },
      1000
    );

    return result?.access_token || null;
  } catch {
    return null;
  }
}

async function getServiceAccountAccessToken(serviceAccount) {
  if (
    !serviceAccount?.client_email ||
    !serviceAccount?.private_key
  ) {
    return null;
  }

  const tokenUrl = serviceAccount.token_uri || GOOGLE_OAUTH_TOKEN_URL;
  const assertion = buildServiceAccountJwt({
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key,
    tokenUrl,
    scope: SECRET_MANAGER_SCOPE,
  });

  const formData = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const result = await fetchJson(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  return result?.access_token || null;
}

async function getSecretManagerAccessToken() {
  const metadataToken = await getMetadataAccessToken();
  if (metadataToken) {
    return {
      accessToken: metadataToken,
      authSource: "gcp-metadata",
      credentials: null,
    };
  }

  const serviceAccount = await loadServiceAccountCredentials();
  if (!serviceAccount) {
    return {
      accessToken: null,
      authSource: null,
      credentials: null,
    };
  }

  const serviceAccountToken = await getServiceAccountAccessToken(serviceAccount);
  return {
    accessToken: serviceAccountToken,
    authSource: serviceAccountToken ? "service-account-json" : null,
    credentials: serviceAccount,
  };
}

async function readSecretViaFirebaseCli({projectId, secretName}) {
  try {
    const {stdout} = await execFileAsync("firebase", [
      "functions:secrets:access",
      secretName,
      "--project",
      projectId,
    ]);

    const trimmed = stdout.trim();
    return trimmed || null;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw new Error(
      error?.stderr?.trim() ||
        error?.message ||
        "firebase functions:secrets:access failed."
    );
  }
}

async function readSecretViaGcloud({projectId, secretName, secretVersion}) {
  try {
    const {stdout} = await execFileAsync("gcloud", [
      "secrets",
      "versions",
      "access",
      secretVersion,
      "--secret",
      secretName,
      "--project",
      projectId,
    ]);

    const trimmed = stdout.trim();
    return trimmed || null;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw new Error(
      error?.stderr?.trim() ||
        error?.message ||
        "gcloud Secret Manager access failed."
    );
  }
}

async function readSecretViaSecretManagerApi({
  projectId,
  secretName,
  secretVersion,
}) {
  const {
    accessToken,
    authSource,
    credentials,
  } = await getSecretManagerAccessToken();

  if (!accessToken) {
    return {
      secretValue: null,
      authSource: null,
      credentialsProjectId: credentials?.project_id || null,
    };
  }

  const response = await fetchJson(
    `${SECRET_MANAGER_BASE_URL}/projects/${encodeURIComponent(
      projectId
    )}/secrets/${encodeURIComponent(secretName)}/versions/${encodeURIComponent(
      secretVersion
    )}:access`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const encodedPayload = response?.payload?.data;
  return {
    secretValue: encodedPayload ?
      Buffer.from(encodedPayload, "base64").toString("utf8").trim() :
      null,
    authSource,
    credentialsProjectId: credentials?.project_id || null,
  };
}

async function resolveOpenAiApiKey(options) {
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) {
    return {
      apiKey: envKey,
      source: "env",
      projectId: options.gcpProjectId,
    };
  }

  const errors = [];
  const firebaseKey = await readSecretViaFirebaseCli({
    projectId: options.gcpProjectId,
    secretName: options.secretName,
  }).catch((error) => {
    errors.push(`firebase CLI: ${error.message}`);
    return null;
  });

  if (firebaseKey) {
    return {
      apiKey: firebaseKey,
      source: "firebase-cli",
      projectId: options.gcpProjectId,
    };
  }

  const gcloudKey = await readSecretViaGcloud({
    projectId: options.gcpProjectId,
    secretName: options.secretName,
    secretVersion: options.secretVersion,
  }).catch((error) => {
    errors.push(`gcloud CLI: ${error.message}`);
    return null;
  });

  if (gcloudKey) {
    return {
      apiKey: gcloudKey,
      source: "gcloud-secret-manager",
      projectId: options.gcpProjectId,
    };
  }

  const apiResult = await readSecretViaSecretManagerApi({
    projectId: options.gcpProjectId,
    secretName: options.secretName,
    secretVersion: options.secretVersion,
  }).catch((error) => {
    errors.push(`Secret Manager API: ${error.message}`);
    return null;
  });

  if (apiResult?.secretValue) {
    return {
      apiKey: apiResult.secretValue,
      source: `secret-manager-api:${apiResult.authSource || "unknown-auth"}`,
      projectId: options.gcpProjectId || apiResult.credentialsProjectId || DEFAULT_GCP_PROJECT_ID,
    };
  }

  const hintParts = [
    "run \"firebase login\" to authenticate the Firebase CLI (same credential path as the app)",
    "or set OPENAI_API_KEY in your environment / functions/.secret.local",
    "or install/authenticate gcloud",
    "or provide Google credentials via GOOGLE_APPLICATION_CREDENTIALS",
  ];

  throw new Error(
    `Could not resolve ${options.secretName} for project ${options.gcpProjectId}. ` +
      `${hintParts.join(", ")}. ` +
      `${errors.length > 0 ? `Details: ${errors.join(" | ")}` : "No usable Google Cloud auth context was found."}`
  );
}

function buildMessages(prompt) {
  return [
    {
      role: "system",
      content: prompt,
    },
  ];
}

async function callOpenAiChatCompletions({apiKey, model, temperature, messages}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      response_format: {type: "json_object"},
    }),
  });

  const result = await response.json();

  if (!response.ok || result?.error) {
    throw new Error(
      result?.error?.message ||
        `OpenAI API request failed with status ${response.status}`
    );
  }

  const content = result?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI API response did not include message content.");
  }

  return {
    raw: result,
    plan: JSON.parse(content),
  };
}

function validateTrainingPlan(plan, input) {
  const issues = [];

  if (!plan || typeof plan !== "object") {
    issues.push("Plan is not a JSON object.");
    return {
      passed: false,
      issues,
    };
  }

  if (typeof plan.summary !== "string" || plan.summary.trim().length === 0) {
    issues.push("Plan is missing a non-empty summary string.");
  }

  if (!Array.isArray(plan.phaseOverview) || plan.phaseOverview.length === 0) {
    issues.push("Plan does not include a non-empty phaseOverview array.");
  }

  if (!Array.isArray(plan.weeks) || plan.weeks.length === 0) {
    issues.push("Plan does not include a non-empty weeks array.");
    return {
      passed: false,
      issues,
    };
  }

  if (plan.weeks.length !== input.numWeeks) {
    issues.push(
      `Plan has ${plan.weeks.length} week(s) but ${input.numWeeks} were requested.`
    );
  }

  plan.weeks.forEach((week, weekIndex) => {
    if (!Array.isArray(week?.days)) {
      issues.push(`Week ${weekIndex + 1} is missing a days array.`);
      return;
    }

    if (week.days.length !== input.daysPerWeek) {
      issues.push(
        `Week ${weekIndex + 1} contains ${week.days.length} days instead of ${input.daysPerWeek}.`
      );
    }

    week.days.forEach((day, dayIndex) => {
      const label = day?.sessionLabel;
      if (label !== undefined && (typeof label !== "string" || !label.match(/^Day\s+\d+/i))) {
        issues.push(
          `Week ${weekIndex + 1} day ${dayIndex + 1} has sessionLabel "${label}" that does not start with "Day N".`
        );
      }

      if (!day?.sessionProfile || typeof day.sessionProfile !== "object") {
        issues.push(
          `Week ${weekIndex + 1} day ${dayIndex + 1} is missing a sessionProfile object.`
        );
      } else if (
        typeof day.sessionProfile.stressLevel !== "string" ||
        day.sessionProfile.stressLevel.trim().length === 0
      ) {
        issues.push(
          `Week ${weekIndex + 1} day ${dayIndex + 1} sessionProfile is missing stressLevel.`
        );
      }

      if (!Array.isArray(day?.exercises) || day.exercises.length === 0) {
        issues.push(
          `Week ${weekIndex + 1} day ${dayIndex + 1} has no exercises array.`
        );
        return;
      }

      day.exercises.forEach((exercise, exerciseIndex) => {
        ["name", "sets", "reps", "notes"].forEach((fieldName) => {
          if (
            typeof exercise?.[fieldName] !== "string" ||
            exercise[fieldName].trim().length === 0
          ) {
            issues.push(
              `Week ${weekIndex + 1} day ${dayIndex + 1} exercise ${exerciseIndex + 1} is missing "${fieldName}".`
            );
          }
        });

        if (exercise?.substitutionOptions !== undefined && !Array.isArray(exercise.substitutionOptions)) {
          issues.push(
            `Week ${weekIndex + 1} day ${dayIndex + 1} exercise ${exerciseIndex + 1} ("${exercise?.name || ""}") has a non-array substitutionOptions.`
          );
        }
      });
    });
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

async function mapWithConcurrency(items, concurrency, handler) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await handler(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from(
    {length: Math.min(Math.max(concurrency, 1), items.length || 1)},
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

async function createManifest({
  outputDir,
  scenarios,
  options,
  summary,
  apiKeySource = null,
}) {
  const manifestPath = path.resolve(outputDir, "manifest.json");
  const instructionKeys = Array.from(
    new Set(
      scenarios.flatMap((scenario) =>
        getEmbeddedInstructionKeys(scenario.input, "plan")
      )
    )
  );

  await writeJson(manifestPath, {
    generatedAt: new Date().toISOString(),
    mode: options.run ? "run" : "dry-run",
    totalCaseCount: scenarios.length,
    casesPerSport: options.casesPerSport,
    selectedSports: options.sports,
    instructionsSource: options.instructionsSource,
    includeImages: options.includeImages,
    model: options.model,
    temperature: options.temperature,
    numWeeks: options.numWeeks,
    trainingPlanBatch: options.trainingPlanBatch,
    gcpProjectId: options.gcpProjectId,
    secretName: options.secretName,
    secretVersion: options.secretVersion,
    apiKeySource,
    summary,
    instructionKeys,
    cases: scenarios.map((scenario) => ({
      sequence: scenario.sequence,
      caseId: scenario.caseId,
      outputFile: path.relative(outputDir, scenario.successOutputPath).split(path.sep).join("/"),
      input: scenario.input,
    })),
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const scenarios = buildScenarioMatrix(options);

  await fs.mkdir(options.outputDir, {recursive: true});

  const summary = {
    requestedCases: scenarios.length,
    generated: 0,
    skipped: 0,
    failed: 0,
  };

  if (!options.run) {
    await createManifest({
      outputDir: options.outputDir,
      scenarios,
      options,
      summary,
    });

    console.log(
      `Prepared manifest for ${scenarios.length} scenario(s) at ${toPosixRelativePath(
        path.resolve(options.outputDir, "manifest.json")
      )}.`
    );
    console.log("Run again with --run to call the OpenAI API and save plan files.");
    return;
  }

  const {apiKey, source: apiKeySource, projectId: resolvedProjectId} =
    await resolveOpenAiApiKey(options);
  options.gcpProjectId = resolvedProjectId || options.gcpProjectId;
  console.log(`Resolved ${options.secretName} from ${apiKeySource}.`);

  await mapWithConcurrency(
    scenarios,
    options.concurrency,
    async (scenario, index) => {
      const existingRecord = await readJsonIfPresent(scenario.successOutputPath);
      if (!options.overwrite && existingRecord?.status === "success") {
        summary.skipped += 1;
        console.log(
          `[${index + 1}/${scenarios.length}] skipped ${scenario.caseId}`
        );
        return;
      }

      const prompt = buildTrainingPrompt(scenario.input, null);
      const messages = buildMessages(prompt);
      const promptSha256 = createHash("sha256").update(prompt).digest("hex");

      try {
        const {raw, plan} = await callOpenAiChatCompletions({
          apiKey,
          model: options.model,
          temperature: options.temperature,
          messages,
        });
        const validation = validateTrainingPlan(plan, scenario.input);

        await writeJson(scenario.successOutputPath, {
          status: "success",
          generatedAt: new Date().toISOString(),
          caseId: scenario.caseId,
          model: options.model,
          temperature: options.temperature,
          promptSha256,
          instructionsSource: options.instructionsSource,
          includeImages: options.includeImages,
          input: scenario.input,
          validation,
          usage: raw?.usage || null,
          plan,
        });

        summary.generated += 1;
        console.log(
          `[${index + 1}/${scenarios.length}] generated ${scenario.caseId}`
        );
      } catch (error) {
        await writeJson(scenario.errorOutputPath, {
          status: "error",
          generatedAt: new Date().toISOString(),
          caseId: scenario.caseId,
          model: options.model,
          temperature: options.temperature,
          promptSha256,
          instructionsSource: options.instructionsSource,
          includeImages: options.includeImages,
          input: scenario.input,
          error: {
            message: error?.message || String(error),
          },
        });

        summary.failed += 1;
        console.error(
          `[${index + 1}/${scenarios.length}] failed ${scenario.caseId}: ${error?.message || error}`
        );
      }
    }
  );

    await createManifest({
      outputDir: options.outputDir,
      scenarios,
      options,
      summary,
      apiKeySource,
    });

  console.log(
    `Finished. Generated ${summary.generated}, skipped ${summary.skipped}, failed ${summary.failed}.`
  );
}

main().catch((error) => {
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
