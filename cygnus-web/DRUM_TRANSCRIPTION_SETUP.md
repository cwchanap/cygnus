# Drum Transcription Setup

## Overview

Cygnus drum transcription now runs entirely in the browser. Users choose an audio file, start transcription from the page, and preview the generated MIDI without a Python API or background job service.

## Local Development

### 1. Start cygnus-web

```bash
cd ~/workspace/cygnus
bun run dev
```

### 2. Open the drum transcription page

- Visit http://localhost:4330/drum-transcription
- Or use the **Transcribe** link in the site navigation

## User Flow

1. Choose or drop a drum audio file
2. Confirm the **File Ready** state
3. Click **Transcribe in Browser**
4. Wait for the **MIDI Preview** dialog to open
5. Review notation and use the playback controls in the preview modal

## Supported Inputs

- MP3
- WAV
- M4A
- FLAC
- Maximum file size: 50 MB

## Optional TFJS Model Configuration

The transcription pipeline tries to load a TensorFlow.js model from `PUBLIC_TFJS_MODEL_URL`.

Example:

```bash
PUBLIC_TFJS_MODEL_URL=/models/drums/model.json
```

If this variable is not set, Cygnus tries `/models/drums/model.json` by default. If no model is available or model inference fails, the app falls back to the built-in browser-side signal-processing path.

## Notes and Limitations

- No server-side transcription service is required
- Processing time depends on file length and the browser/device performance
- Model downloads, when configured, happen in the browser at runtime
- Unsupported or corrupt audio files will fail during browser decoding and show an error toast
