/**
 * Helper function to get a random item from an array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper function to format a template string with values
 */
export function formatTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}
