import { normalizeSafeReturnToPath } from "./inputValidation.js";

export function getParamValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function getSafeReturnToPath(params = {}, fallback = "") {
  const rawReturnTo =
    getParamValue(params.return_to) || getParamValue(params.returnTo) || "";
  const returnTo = normalizeSafeReturnToPath(rawReturnTo);

  return returnTo || fallback;
}
