/**
 * Substitutes `{placeholders}` in a message that was resolved on the server but
 * whose values are only known on the client — a scan count, the name of the
 * source a row is about.
 *
 * The server-side translator already does this (`createTranslator`), but a
 * translator is a function and functions do not cross the server/client
 * boundary. So the page passes the raw template down and the client fills it in,
 * using the same `{name}` syntax as the catalogue.
 */
export type MessageValues = Readonly<Record<string, string | number>>;

export function formatMessage(template: string, values: MessageValues): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return value === undefined ? match : String(value);
  });
}
