<script lang="ts">
  import { jobsStore } from '../stores/jobs';

  $: hasMidiJobs = $jobsStore.some(job => job.status === 'completed' && job.result_url);
</script>

<a
  href="/midi-preview"
  class="text-white hover:text-white transition-all duration-300 hover:scale-110 hover:drop-shadow-lg"
  title="MIDI"
>
  MIDI
</a>
