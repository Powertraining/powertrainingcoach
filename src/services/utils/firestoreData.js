function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function sanitizeFirestoreData(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => {
      const sanitizedEntry = sanitizeFirestoreData(entry);
      return sanitizedEntry === undefined ? null : sanitizedEntry;
    });
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, nestedValue]) => {
        const sanitizedValue = sanitizeFirestoreData(nestedValue);
        return sanitizedValue === undefined ? [] : [[key, sanitizedValue]];
      })
    );
  }

  return value;
}
