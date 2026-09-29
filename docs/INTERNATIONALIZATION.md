# Internationalisation (LTR / RTL)

The product ships **English (LTR), Arabic (RTL) and German (LTR)**. All three are
first-class: there is no "English version" the others are retrofitted onto.

**Why this is enforced rather than reviewed.** RTL and translation bugs are the one
class of defect that is _invisible to the people reviewing it_. `ml-4` looks perfectly
correct in an English review, ships, and puts the margin on the wrong side of every
Arabic screen. `"Sign in"` looks like working code. Nobody notices until a customer
does. So both are lint errors, not guidelines.

**Single source: `design-system/locales.json`.** Adding a locale is one edit there;
`pnpm ds:i18n` regenerates the types and the per-language font binding.

---

## 1. Direction: use logical properties, never physical ones

| Never                      | Always                    | Why                      |
| -------------------------- | ------------------------- | ------------------------ |
| `ml-4` / `mr-4`            | `ms-4` / `me-4`           | margin-inline-start/end  |
| `pl-4` / `pr-4`            | `ps-4` / `pe-4`           | padding-inline-start/end |
| `left-0` / `right-0`       | `start-0` / `end-0`       | inset-inline-start/end   |
| `text-left` / `text-right` | `text-start` / `text-end` |                          |
| `border-l` / `border-r`    | `border-s` / `border-e`   |                          |
| `rounded-tl-md`            | `rounded-ss-md`           | start-start corner       |
| `float-left`               | `float-start`             |                          |
| `marginLeft` (style/CSS)   | `marginInlineStart`       |                          |

Logical properties resolve against the `dir` attribute at runtime. **One class is
correct in both directions, with no runtime branch to forget.** That is the entire
strategy — everything else is a fallback.

Enforced by `local/no-physical-direction` (TS/TSX) and `pnpm ds:rtl` (hand-written CSS).

### When you genuinely need direction

`rtl:` and `ltr:` variants are allowed, because they are deliberate and visible:

```tsx
// A chevron points at content, so it must mirror. A checkmark must not.
<ChevronIcon className="rtl:-scale-x-100" />
```

Mirror: arrows, chevrons, back/forward, progress, indentation, send.
Do **not** mirror: logos, checkmarks, clocks, media play buttons, most brand marks.

For maths that CSS cannot express — drag deltas, transforms, keyboard arrow handling —
use `useDirection()` and `directionSign(dir)` from `@shared/lib`.

## 2. Message catalogues — under `public/`, one file per locale per area

```
public/lang/
├── en/
│   ├── common.json    app-wide chrome only (app name, theme, language)
│   ├── auth.json      the login / sign-up area
│   ├── errors.json    error boundary + not found
│   └── workspace.json
├── ar/  (same four files)
└── de/  (same four files)
```

Each file is flat — no locale wrapper, because the folder already says which language
it is:

```json
// public/lang/en/auth.json
{ "submit": "Sign in", "emailLabel": "Email address" }

// public/lang/ar/auth.json
{ "submit": "تسجيل الدخول", "emailLabel": "البريد الإلكتروني" }
```

**Locale-first, unlike `theme.json` / `contract.json` / `locales.json`.** Those are one
file with every value keyed inside, and that is correct for them — small config, read
once, all together, at build time. Message catalogues live under `public/` on purpose:
Next.js serves everything there verbatim, so `public/lang/en/auth.json` is a real,
independently fetchable URL. A browser asking for German must never receive English and
Arabic bundled alongside it — the file boundary here **is** the network boundary, which
a single wrapped file would defeat.

**One namespace file per page or feature area, inside each locale folder.** A new page
gets a new file in every locale folder — that is the unit that scales, because a single
catalogue with everything in it means every feature branch edits the same file,
translators receive one undifferentiated blob, and every page bundles every string in
the app. At 40 pages a flat catalogue is ~840 keys in one file that everyone touches.

### Keys are scoped, so they stay short

Inside `auth.json` the key is `submit`, not `login.submit` — the file already says
which area it belongs to. That also removes the collision problem that forces
hand-written prefixes: forty pages can each have a `title`.

### Using it

```tsx
// A page declares the areas it needs.
const t = getTranslator(locale, 'auth');
const tc = getTranslator(locale, 'common');

t('submit'); // ok
t('changeTheme'); // compile error — that key lives in `common`
```

A translator is scoped to **one** namespace. Reaching into another area fails to
compile rather than rendering a raw key, and a page bundles only what it uses.

Client components that cannot receive route params — Next's `error.tsx` — use
`useLocale()`, which reads the server-rendered `<html lang>`.

There is deliberately **no global "current locale"**. It is resolved per request and
passed down; a module-level mutable locale is the classic way a server renders one
user's page in another user's language.

### The gate

`pnpm ds:i18n --check` validates **every namespace × every locale** and reports
everything at once — whoever is fixing it wants the whole list, not to fix one file and
rerun to find the next:

| Problem                                             | Why it blocks                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Stray locale folder (not declared)                  | Translations maintained for a language `locales.json` doesn't declare — the app can never resolve to it |
| Locale folder missing entirely                      | Every namespace for that locale renders in the default language                                         |
| Namespace file missing for one locale               | That area renders in the default language for that locale                                               |
| Namespace file exists only for a non-default locale | Invisible to namespace discovery, which scans the default locale's folder first                         |
| Missing message key                                 | Renders English inside a German page — invisible to a developer who reads English                       |
| Extra message key                                   | A stale string translators keep maintaining forever                                                     |
| Placeholder mismatch                                | `{name}` renamed to `{benutzer}` silently drops the value                                               |
| Empty value                                         | A blank label ships                                                                                     |
| Empty namespace file                                | Becomes a place people add strays                                                                       |
| `common` over 40 keys                               | `common` has no natural owner, so it is where strings get dumped when nobody wants to decide            |

`MessageKeys` and the import map are both generated, so adding a namespace or a locale
needs no hand-editing anywhere.

## 3. Locale resolution

Configured in `locales.json` → `resolution.strategy`, mirroring
`WORKSPACE_RESOLUTION_STRATEGY`. Same reasoning: it is a product decision, it may
change, and it should change in one place.

| Strategy           | URL            | Use when                                             |
| ------------------ | -------------- | ---------------------------------------------------- |
| `path`             | `/de/settings` | Shareable, cacheable, survives a copied link         |
| `cookie` (default) | unchanged      | App behind login where language is a profile setting |
| `header`           | unchanged      | Marketing only; the user gets no control             |

This app runs `cookie`: the language switcher is a control in the page, not a
navigation, and there is no per-locale route (`src/app/[locale]/` doesn't exist —
pages live directly under `src/app/`). Workspace is resolved by **subdomain**, so a
`path` prefix would not collide with it if the strategy ever changed back:
`acme.jethur.com/de/settings` is unambiguous.

Middleware resolves the locale from the cookie (or negotiates it from
`Accept-Language` when the cookie is absent) and forwards it on a request header
(`resolution.headerName`) for this same request's Server Components to read — see
`getRequestLocale()` in `@shared/lib/request-locale`. It also writes the cookie back
so a returning visitor is not re-negotiated — `Accept-Language` alone ignores an
explicit choice. The switcher writes that same cookie directly and calls
`router.refresh()`, which re-fetches Server Components (translated copy, `lang`,
`dir`) for the page the user is already on.

## 4. Copy: components receive text, they do not contain it

```tsx
// BANNED — untranslatable, and the English build looks perfect
<button>Sign in</button>
<input placeholder="you@example.com" />

// CORRECT — copy arrives as props
<button>{t.submit}</button>
```

Enforced by `local/no-literal-ui-text` in **`src/components/**` and `src/app/**`** —
pages included, because a page is exactly where "just this one string" gets typed.

**The line the rule draws:**

- **Banned:** copy in JSX text, and inline literals in user-facing attributes
  (`aria-label`, `title`, `placeholder`, `alt`). That is copy welded into markup —
  no caller can replace it.
- **Allowed:** a named defaults object whose values reach JSX through props:

```tsx
const DEFAULT_MESSAGES: LoginFormMessages = { submit: 'Sign in' /* … */ };
const t = { ...DEFAULT_MESSAGES, ...messages };
```

English defaults are deliberate for accessibility strings — an unlabelled control is
worse than an untranslated one. What matters is that **the prop exists**, so the app
can localise it. `LoginForm` and `ThemeToggle` are the reference implementations.

## 5. What `dir` and `lang` drive

`<html lang dir>` is **server-rendered** from the locale, so RTL layout is correct on
first paint — no direction flash, nothing for the client to fix.

- `dir` → every logical property, and the `rtl:` variant.
- `lang` → the per-language font (`design-system/tokens/locale.css`), screen-reader
  pronunciation, and hyphenation.

Arabic uses its own font stack because the default UI stack has poor Arabic coverage
and the fallback glyphs are visibly wrong. Set it in `theme.json` → `fontFamily`.

## 6. Numbers, dates, currency

Always `Intl`, never manual formatting. `toLocaleDateString(locale)` respects the
calendar and numbering system; hand-built `DD/MM/YYYY` does not.

`locales.json` records `numberingSystem` per locale. Arabic is set to `latn` (Western
digits), which most Gulf business software expects — switch to `arab` for Eastern
Arabic numerals. That is a product decision, not a technical one.

## 7. Things that bite

- **Never concatenate sentences.** `"Deleted " + n + " items"` is untranslatable —
  word order and pluralisation differ. One message per sentence, with placeholders.
- **Text expands.** German runs ~30% longer than English (`Passwort vergessen?`,
  `Melden Sie sich bei Ihrem Workspace an`). Every component gets a long-content story;
  fixed-width containers break in German before they break anywhere else.
- **Bidi text.** An Arabic sentence containing an English product name needs isolation
  (`<bdi>`), or punctuation jumps to the wrong end.
- **Icons in buttons** follow `startSlot` / `endSlot`, never `leftIcon` / `rightIcon` —
  which is exactly why the contract bans those names.

## 8. Checking your work

```bash
pnpm storybook   # Direction toolbar: LTR / RTL
pnpm verify      # includes ds:i18n --check, ds:rtl, and both lint rules
pnpm dev         # then use the language switcher — it's a cookie, not a route
```

## 9. Adding a page

1. Create `<area>.json` in **every** locale folder: `public/lang/en/<area>.json`,
   `public/lang/ar/<area>.json`, `public/lang/de/<area>.json` — the default locale's
   copy is what defines the namespace, so create it first.
2. `pnpm ds:i18n` — types and the import map regenerate.
3. In the page: `const t = getTranslator(locale, '<area>')`.

Nothing to register centrally, which is the point — but the file has to exist in
every locale folder, or `ds:i18n --check` reports it as missing translation.

## 10. Adding a language

1. Add it to `design-system/locales.json` (name, native name, `dir`, font family).
2. Create `public/lang/<code>/` and add every namespace file that
   `public/lang/<defaultLocale>/` has, translated.
3. `pnpm ds:i18n` then `pnpm verify`.

The import map is generated, so there is no hand-maintained list to forget. The gate
names every missing file and key by namespace and locale.

Every component's stories should be viewed in **both** directions and **both** themes —
four states. The toolbar makes that a two-click check, so there is no excuse for
shipping a component nobody looked at in Arabic.
