/**
 * Brand mark, headline, trust bullets and a testimonial — the dark left panel of
 * the login page. Page-local, like `LocaleControls`: this is auth-page marketing
 * copy, not a reusable UI primitive, so it lives here rather than in the design
 * system. Composed only from atoms; every string arrives as a prop, resolved by
 * `page.tsx` from the message catalogue.
 */
import { Languages, ShieldCheck, Sparkles } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Divider } from '@atoms/Divider';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';

export type TrustPanelMessages = {
  brandName: string;
  headline: string;
  subhead: string;
  bulletEncryption: string;
  bulletLanguages: string;
  bulletAi: string;
  testimonialQuote: string;
  testimonialInitials: string;
  testimonialName: string;
  testimonialRole: string;
};

const BULLETS = (t: TrustPanelMessages) => [
  { icon: <ShieldCheck className="size-4" />, text: t.bulletEncryption },
  { icon: <Languages className="size-4" />, text: t.bulletLanguages },
  { icon: <Sparkles className="size-4" />, text: t.bulletAi },
];

export function TrustPanel({ t }: { t: TrustPanelMessages }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2">
          <span className="bg-accent-solid text-fg-on-accent rounded-control grid size-8 place-items-center text-sm font-bold">
            J
          </span>
          <Text size="lg" weight="semibold" tone="inverse">
            {t.brandName}
          </Text>
        </div>

        <div className="flex flex-col gap-3">
          <Heading level={1} size="2xl" tone="inverse">
            {t.headline}
          </Heading>
          <Text size="md" tone="inverse">
            {t.subhead}
          </Text>
        </div>

        <ul className="flex flex-col gap-3">
          {BULLETS(t).map((bullet) => (
            <li key={bullet.text} className="flex items-center gap-3">
              <span aria-hidden className="text-fg-inverse">
                {bullet.icon}
              </span>
              <Text size="sm" tone="inverse">
                {bullet.text}
              </Text>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Divider tone="subtle" />
        <Text size="sm" tone="inverse">
          &ldquo;{t.testimonialQuote}&rdquo;
        </Text>
        <div className="flex items-center gap-3">
          <Avatar label={t.testimonialName} initials={t.testimonialInitials} tone="accent" />
          <div>
            <Text size="sm" weight="medium" tone="inverse">
              {t.testimonialName}
            </Text>
            <Text size="xs" tone="inverse">
              {t.testimonialRole}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
