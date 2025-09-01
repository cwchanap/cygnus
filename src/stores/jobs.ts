import { writable } from 'svelte/store';

export interface Job {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  progress: number;
  result_url?: string;
  error?: string;
  metadata?: {
    filename: string;
    file_size: number;
  };
}

// Configure the API base URL for the Crux Python server
const API_BASE_URL = import.meta.env.PUBLIC_CRUX_API_URL || 'http://localhost:9331';

function createJobsStore() {
  const { subscribe, set } = writable<Job[]>([]);
  let autoRefreshInterval: number | null = null;

  const loadJobs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs?limit=10`);
      if (!response.ok) throw new Error('Failed to load jobs');
      
      const data = await response.json() as { jobs: Job[] };
      set(data.jobs);
      
      // Auto-refresh if any jobs are in progress
      const hasActiveJobs = data.jobs.some((job: Job) => job.status === 'processing' || job.status === 'pending');
      
      if (hasActiveJobs && !autoRefreshInterval) {
        startAutoRefresh();
      } else if (!hasActiveJobs && autoRefreshInterval) {
        stopAutoRefresh();
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Silently fail if API is not available
    }
  };

  const startAutoRefresh = () => {
    if (autoRefreshInterval) return;
    autoRefreshInterval = window.setInterval(loadJobs, 2000);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  };

  return {
    subscribe,
    loadJobs,
    startAutoRefresh,
    stopAutoRefresh
  };
}

export const jobsStore = createJobsStore();
