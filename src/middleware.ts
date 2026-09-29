/**
 * Request preprocessing: workspace resolution (layer 1), auth route protection, and
 * locale resolution — for page routes only, see the matcher below.
 *
 * What arrives from the client is UNTRUSTED here.
 * The slug and the locale segment are normalised and shape-checked; authorisation
 * and registry lookup happen in the app layer, never in middleware.
 *
 * The `x-workspace-slug` header set here is only ever seen by page routes — the
 * matcher excludes `/api/**`, so a Route Handler that needs the resolved slug calls
 * `resolveWorkspaceSlugFromHost()` directly on its own request instead of reading a
 * header this middleware never forwards to it.
 *
 * See docs/WORKSPACE_ISOLATION.md §3 and docs/INTERNATIONALIZATION.md §3.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@server/auth/cookies';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { resolveLocale } from '@shared/lib/locale-routing';
import { LOCALE_RESOLUTION } from '@shared/types/locale';

/**
 * A `returnTo` is only honoured when it is a same-origin path: one leading slash
 * and no scheme. `//evil.example` is a protocol-relative URL, which some URL
 * parsers treat as an absolute one — that is the classic open-redirect shape.
 */
function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return null;
  }
  return value;
}

/**
 * `pathname` is the locale-stripped path (`resolution.pathname`), so `/en/login`
 * and `/login` are the same route here under every locale strategy.
 */
function handleRouteProtection(
  request: NextRequest,
  pathname: string,
  sessionToken: string | undefined,
): NextResponse | null {
  const isAuthRoute = pathname.startsWith('/login');
  const isRootRoute = pathname === '/';

  if (!isAuthRoute && !isRootRoute && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('returnTo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = safeReturnTo(request.nextUrl.searchParams.get('returnTo')) ?? '/dashboard';
    url.searchParams.delete('returnTo');
    return NextResponse.redirect(url);
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const resolution = resolveLocale({
    pathname,
    cookie: request.cookies.get(LOCALE_RESOLUTION.cookieName)?.value,
    acceptLanguage: request.headers.get('accept-language'),
  });

  if (resolution.shouldRedirect && resolution.redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = resolution.redirectTo;
    return NextResponse.redirect(url);
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const redirectResponse = handleRouteProtection(request, resolution.pathname, sessionToken);
  if (redirectResponse) {
    return redirectResponse;
  }

  const headers = new Headers(request.headers);
  headers.set(LOCALE_RESOLUTION.headerName, resolution.locale);

  const slug = resolveWorkspaceSlugFromHost(request.headers.get('host'));
  if (slug) {
    headers.set('x-workspace-slug', slug);
  }

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(LOCALE_RESOLUTION.cookieName, resolution.locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  // Static assets and API routes carry no locale prefix.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
