import { redirect } from 'next/navigation';

/**
 * Root route. Sign-in lives at `/login` (see `(auth)/login/page.tsx`) so this
 * path is free for a real dashboard once one exists post-authentication.
 */
export default function HomePage() {
  redirect('/login');
}
