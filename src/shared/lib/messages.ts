/**
 * Message loading and translation.
 *
 * Catalogues live at `public/lang/<locale>/<namespace>.json` — locale-first, so each
 * file is also directly fetchable by URL (`/lang/de/auth.json`) and a browser asking
 * for one language is never handed the other two. See docs/INTERNATIONALIZATION.md §2.
 *
 * A translator is scoped to ONE namespace. That is what makes this scale: a page
 * declares the areas it needs, the compiler rejects keys from anywhere else, and a
 * feature branch only ever edits its own namespace file, in every locale folder.
 *
 * There is deliberately no global "current locale". Locale is resolved per request
 * and passed down — a module-level mutable locale is the classic way a server
 * renders one user's page in another user's language.
 */
import { CATALOGUES } from '@shared/types/catalogues';
import type { Locale } from '@shared/types/locale';
import type { MessageKeys, MessageNamespace, NamespaceMessages } from '@shared/types/messages';

export type TranslateValues = Readonly<Record<string, string | number>>;

/** Translate within one namespace, substituting `{placeholders}`. */
export type Translate<N extends MessageNamespace> = (
  key: MessageKeys[N],
  values?: TranslateValues,
) => string;

export function getMessages<N extends MessageNamespace>(
  locale: Locale,
  namespace: N,
): NamespaceMessages<N> {
  return CATALOGUES[namespace][locale];
}

/**
 * Build a translator bound to one catalogue.
 *
 * There is no missing-key fallback because a missing key cannot occur: `MessageKeys`
 * is generated from the default catalogue, the type is a total record over it, and
 * `pnpm ds:i18n --check` proves every locale covers every namespace. A runtime
 * fallback would only hide a failure the build already prevents.
 */
export function createTranslator<N extends MessageNamespace>(
  messages: NamespaceMessages<N>,
): Translate<N> {
  return (key, values) => {
    const template = messages[key];
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = values[name];
      return value === undefined ? match : String(value);
    });
  };
}

/**
 * Resolve a namespace-scoped translator. The usual entry point in a page:
 *
 * ```ts
 * const t = getTranslator(locale, 'auth');
 * t('submit');        // ok
 * t('themeLight');    // compile error — that key lives in `common`
 * ```
 */
export function getTranslator<N extends MessageNamespace>(
  locale: Locale,
  namespace: N,
): Translate<N> {
  return createTranslator(getMessages(locale, namespace));
}
