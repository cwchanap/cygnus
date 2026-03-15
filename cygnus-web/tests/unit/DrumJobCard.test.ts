import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import DrumJobCard from '../../src/components/DrumJobCard.svelte';

vi.mock('../../src/stores/midi', () => ({
  midiStore: {
    openPreview: vi.fn(),
  },
}));

const baseJob = {
  job_id: 'abc12345-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  status: 'completed' as const,
  created_at: '2024-06-15T10:30:00.000Z',
  updated_at: '2024-06-15T10:31:00.000Z',
  progress: 100,
  error: null,
  metadata: { filename: 'drums.mp3' },
};

describe('DrumJobCard', () => {
  it('renders the truncated job id', () => {
    render(DrumJobCard, { props: { job: baseJob } });
    expect(screen.getByText(/abc12345/)).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(DrumJobCard, { props: { job: baseJob } });
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('renders the filename when metadata.filename is present', () => {
    render(DrumJobCard, { props: { job: baseJob } });
    expect(screen.getByText('drums.mp3')).toBeInTheDocument();
  });

  it('does not render filename when metadata.filename is absent', () => {
    const job = { ...baseJob, metadata: undefined };
    render(DrumJobCard, { props: { job } });
    expect(screen.queryByText('drums.mp3')).not.toBeInTheDocument();
  });

  it('shows Download MIDI and Preview buttons for completed jobs', () => {
    render(DrumJobCard, { props: { job: baseJob } });
    expect(
      screen.getByRole('button', { name: /Download MIDI/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Preview/i })
    ).toBeInTheDocument();
  });

  it('does not show action buttons for pending jobs', () => {
    const job = { ...baseJob, status: 'pending' as const, progress: 0 };
    render(DrumJobCard, { props: { job } });
    expect(
      screen.queryByRole('button', { name: /Download MIDI/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Preview/i })
    ).not.toBeInTheDocument();
  });

  it('shows progress bar for processing jobs', () => {
    const job = { ...baseJob, status: 'processing' as const, progress: 60 };
    render(DrumJobCard, { props: { job } });
    expect(screen.getByText(/60% complete/i)).toBeInTheDocument();
  });

  it('clamps progress above 100 to 100%', () => {
    const job = { ...baseJob, status: 'processing' as const, progress: 150 };
    render(DrumJobCard, { props: { job } });
    expect(screen.getByText(/100% complete/i)).toBeInTheDocument();
  });

  it('clamps progress below 0 to 0%', () => {
    const job = { ...baseJob, status: 'processing' as const, progress: -5 };
    render(DrumJobCard, { props: { job } });
    expect(screen.getByText(/0% complete/i)).toBeInTheDocument();
  });

  it('shows error message for failed jobs', () => {
    const job = {
      ...baseJob,
      status: 'failed' as const,
      error: 'Transcription error: unsupported format',
    };
    render(DrumJobCard, { props: { job } });
    expect(
      screen.getByText(/Transcription error: unsupported format/i)
    ).toBeInTheDocument();
  });

  it('shows default error message for failed jobs with no error field', () => {
    const job = { ...baseJob, status: 'failed' as const, error: null };
    render(DrumJobCard, { props: { job } });
    expect(
      screen.getByText(/Transcription failed\. Please try again\./i)
    ).toBeInTheDocument();
  });

  it('does not show progress bar for completed jobs', () => {
    render(DrumJobCard, { props: { job: baseJob } });
    expect(screen.queryByText(/% complete/i)).not.toBeInTheDocument();
  });

  it('renders the formatted creation date', () => {
    render(DrumJobCard, { props: { job: baseJob } });
    const formatted = new Date(baseJob.created_at).toLocaleString();
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });
});
