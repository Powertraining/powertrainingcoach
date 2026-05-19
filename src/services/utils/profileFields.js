export function parseEventPreparation(value = "") {
  const text = String(value || "").trim();
  const dateMatch = /\d{4}-\d{2}-\d{2}/.exec(text);
  const descriptionMatch = /Description:\s*(.*)$/i.exec(text);
  const fallbackDescription = text
    .replace(/Date:\s*\d{4}-\d{2}-\d{2}/i, "")
    .replace(/\d{4}-\d{2}-\d{2}/, "")
    .replace(/^[;,\s]+|[;,\s]+$/g, "");

  return {
    hasEvent: Boolean(text),
    date: dateMatch ? dateMatch[0] : "",
    description: descriptionMatch ? descriptionMatch[1].trim() : fallbackDescription,
  };
}

export function getEventPreparationDate(value = "") {
  return parseEventPreparation(value).date || String(value || "");
}

export function formatEventPreparation(date, description) {
  return [
    date ? `Date: ${date}` : "",
    description ? `Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function parseInjuryReport(value = "") {
  return String(value || "").trim();
}
