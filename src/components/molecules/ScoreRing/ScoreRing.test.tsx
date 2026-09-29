import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreRing } from './ScoreRing';

describe('ScoreRing', () => {
  it('renders the rounded percentage and an accessible label', () => {
    render(<ScoreRing value={62} label="Overall readiness score" />);
    expect(screen.getByText('62%')).toBeDefined();
    expect(screen.getByRole('img', { name: 'Overall readiness score: 62%' })).toBeDefined();
  });

  it('clamps out-of-range values', () => {
    render(<ScoreRing value={150} label="Score" />);
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('renders a description when supplied', () => {
    render(<ScoreRing value={62} label="Score" description="Developing" />);
    expect(screen.getByText('Developing')).toBeDefined();
  });

  it('prefers a supplied valueLabel over the computed percentage', () => {
    render(<ScoreRing value={18} max={24} label="Answered" valueLabel="18 of 24 questions" />);
    expect(screen.getByRole('img', { name: '18 of 24 questions' })).toBeDefined();
  });
});
