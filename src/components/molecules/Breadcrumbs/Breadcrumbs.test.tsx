import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

const items = [
  { label: 'Acme Retail', href: '/w/acme' },
  { label: 'Processing records', href: '/w/acme/records' },
  { label: 'Payroll processing' },
];

describe('Breadcrumbs', () => {
  it('is a named navigation landmark, so it can be told apart from the other nav', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeDefined();
  });

  /**
   * The most common breadcrumb defect: a link to the page you are already on.
   * It is a dead control, and it hides which crumb is current.
   */
  it('renders the current page as text, not as a link', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('Payroll processing').getAttribute('aria-current')).toBe('page');
  });

  it('renders a crumb with no href as text even mid-trail', () => {
    render(
      <Breadcrumbs
        items={[{ label: 'Acme' }, { label: 'Records', href: '/r' }, { label: 'Now' }]}
      />,
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  /** A list already conveys position; "slash, slash, slash" is pure noise. */
  it('hides the separators from assistive technology', () => {
    render(<Breadcrumbs items={items} separator={<span>/</span>} testId="crumbs" />);
    const separators = screen.getByTestId('crumbs').querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(items.length - 1);
  });

  it('takes the landmark name from the caller, so it can be translated', () => {
    render(<Breadcrumbs items={items} label="Brotkrumennavigation" />);
    expect(screen.getByRole('navigation', { name: 'Brotkrumennavigation' })).toBeDefined();
  });
});
