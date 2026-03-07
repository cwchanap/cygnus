import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Stub fetch globally before any imports that use it
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('jobsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('starts with an empty jobs list', async () => {
    const { jobsStore } = await import('../../src/stores/jobs');
    expect(get(jobsStore)).toEqual([]);
  });

  it('loads jobs from the API and updates the store', async () => {
    const fakeJobs = [
      { job_id: 'abc', status: 'completed', created_at: '', updated_at: '', progress: 100 },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: fakeJobs }),
    });

    const { jobsStore } = await import('../../src/stores/jobs');
    await jobsStore.loadJobs();
    expect(get(jobsStore)).toEqual(fakeJobs);
  });

  it('handles a network error gracefully without throwing', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { jobsStore } = await import('../../src/stores/jobs');
    await expect(jobsStore.loadJobs()).resolves.toBeUndefined();
  });

  it('handles a non-ok HTTP response gracefully without throwing', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const { jobsStore } = await import('../../src/stores/jobs');
    await expect(jobsStore.loadJobs()).resolves.toBeUndefined();
  });

  it('keeps polling alive after a fetch error to allow recovery', async () => {
    const { jobsStore } = await import('../../src/stores/jobs');

    // Start with active jobs that should trigger auto-refresh
    const activeJobs = [
      { job_id: 'abc', status: 'processing' as const, created_at: '', updated_at: '', progress: 50 },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: activeJobs }),
    });

    await jobsStore.loadJobs();
    const jobs1 = get(jobsStore);
    expect(jobs1).toEqual(activeJobs);

    // Simulate a network error on next fetch
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await jobsStore.loadJobs();

    // Verify polling should still be active (error shouldn't stop it)
    // The store should still contain the previous jobs data
    const jobs2 = get(jobsStore);
    expect(jobs2).toEqual(activeJobs);

    // Verify auto-refresh is still possible by making a successful call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobs: [] }),
    });

    await jobsStore.loadJobs();
    const jobs3 = get(jobsStore);
    expect(jobs3).toEqual([]);
  });
});
