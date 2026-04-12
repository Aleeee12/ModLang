export function shouldSkipTranslation(text: string) {
  const trimmed = text.trim();

  if (!trimmed) return true;

  if (/^\{image:[^}]+\}$/i.test(trimmed)) return true;

  if (/^(§[0-9a-fk-or])+$ /i.test(trimmed)) return true;

  if (
    /^([%][0-9$]*[sdif]|%%|\{[^}]+\}|\[[^\]]+\]|\<[^\>]+\>|§[0-9a-fk-or]|\s)+$/i.test(
      trimmed
    )
  ) {
    return true;
  }

  return false;
}

export function protectPlaceholders(text: string) {
  const tokens: string[] = [];

  const protectedText = text.replace(
    /%(\d+\$)?[sdif]|%%|\{[^}]+\}|\[[^\]]+\]|\<[^\>]+\>|§[0-9a-fk-or]|minecraft:[a-z0-9_./-]+|[a-z0-9_.-]+:[a-z0-9_./-]+/gi,
    (match) => {
      const token = `__PH_${tokens.length}__`;
      tokens.push(match);
      return token;
    }
  );

  return { protectedText, tokens };
}

export function restorePlaceholders(text: string, tokens: string[]) {
  let result = text;

  tokens.forEach((value, index) => {
    result = result.replaceAll(`__PH_${index}__`, value);
  });

  return result;
}