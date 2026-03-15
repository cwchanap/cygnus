import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// vi.hoisted runs before any imports, so we must implement the store manually
const { jobsWritable } = vi.hoisted(() => {
  type Subscriber = (value: unknown[]) => void;
  let _value: unknown[] = [];
  const subs: Subscriber[] = [];
  const subscribe = (fn: Subscriber) => {
    subs.push(fn);
    fn(_value);
    return () => subs.splice(subs.indexOf(fn), 1);
  };
  const set = (v: unknown[]) => {
    _value = v;
    subs.forEach((fn) => {
      fn(v);
    });
  };
  return { jobsWritable: { subscribe, set } };
});

vi.mock('../../src/stores/jobs', () => ({
  jobsStore: {
    subscribe: jobsWritable.subscribe,
    loadJobs: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../src/stores/midi', () => ({
  midiStore: {
    openPreview: vi.fn(),
  },
}));

import DrumJobsList from '../../src/components/DrumJobsList.svelte';

describe('DrumJobsList', () => {
  it('shows empty state when there are no jobs', () => {
    jobsWritable.set([]);
    render(DrumJobsList);
    expect(screen.getByText(/No transcription jobs yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Upload an audio file to get started/i)
    ).toBeInTheDocument();
  });

  it('does not show empty state when jobs exist', () => {
    jobsWritable.set([
      {
        job_id: 'job-001',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:01:00Z',
        progress: 100,
        error: null,
        metadata: { filename: 'beat.mp3' },
      },
    ]);
    render(DrumJobsList);
    expect(
      screen.queryByText(/No transcription jobs yet/i)
    ).not.toBeInTheDocument();
  });

  it('renders a job card for each job', () => {
    jobsWritable.set([
      {
        job_id: 'job-aaa111',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        progress: 0,
        error: null,
        metadata: { filename: 'song1.wav' },
      },
      {
        job_id: 'job-bbb222',
        status: 'completed',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:01:00Z',
        progress: 100,
        error: null,
        metadata: { filename: 'song2.mp3' },
      },
    ]);
    render(DrumJobsList);
    expect(screen.getByText('song1.wav')).toBeInTheDocument();
    expect(screen.getByText('song2.mp3')).toBeInTheDocument();
  });

  it('renders the section heading', () => {
    jobsWritable.set([]);
    render(DrumJobsList);
    expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
  });
});
