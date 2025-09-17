# Drum Transcription Integration Setup

## Overview

The drum transcription feature from Crux has been successfully integrated into Cygnus. This allows you to upload drum audio files and get AI-powered MIDI transcriptions.

## Setup Instructions

### 1. Start the Crux Python API Server

```bash
cd ~/workspace/Crux
uv run uvicorn src.app.main:app --reload --port 8000
```

### 2. Configure Cygnus (Optional)

If the Crux server is running on a different URL, create a `.env` file in the Cygnus root:

```bash
PUBLIC_CRUX_API_URL=http://localhost:8000
```

### 3. Start Cygnus Development Server

```bash
cd ~/workspace/cygnus
npm run dev
```

### 4. Access the Drum Transcription Page

- Open http://localhost:4332 in your browser
- Click on "🥁 Transcribe" in the navigation menu
- Or directly visit http://localhost:4332/drum-transcription

## Features

- **File Upload**: Supports MP3, WAV, M4A, and FLAC files (max 50MB)
- **Job Management**: View status of transcription jobs
- **MIDI Preview**: Visual notation and playback of generated MIDI
- **Download**: Save transcribed MIDI files

## Components Added

- `DrumFileUpload.svelte`: File upload interface
- `DrumJobsList.svelte`: List of transcription jobs
- `DrumJobCard.svelte`: Individual job display
- `DrumMidiPreview.svelte`: MIDI notation and playback
- `DrumToast.svelte`: Notification system

## Stores Added

- `stores/jobs.ts`: Job management and auto-refresh
- `stores/midi.ts`: MIDI playback control
- `stores/toast.ts`: Toast notifications

## Troubleshooting

- Ensure both servers are running (Crux on port 8000, Cygnus on port 4332)
- Check browser console for CORS errors
- Verify the API URL in the environment variable matches the Crux server location
