import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MidiNavButton from '../../src/components/MidiNavButton.svelte';

describe('MidiNavButton', () => {
  it('renders a link with text "MIDI"', () => {
    render(MidiNavButton);
    const link = screen.getByRole('link', { name: /midi/i });
    expect(link).toBeInTheDocument();
  });

  it('links to /midi-preview', () => {
    render(MidiNavButton);
    const link = screen.getByRole('link', { name: /midi/i });
    expect(link).toHaveAttribute('href', '/midi-preview');
  });

  it('has the correct title attribute', () => {
    render(MidiNavButton);
    const link = screen.getByRole('link', { name: /midi/i });
    expect(link).toHaveAttribute('title', 'MIDI');
  });
});
