import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import DrumFileUpload from '../../src/components/DrumFileUpload.svelte';
import { toastStore } from '../../src/stores/toast';

const transcribeInBrowser = vi.fn();
const openPreviewFromArrayBuffer = vi.fn();
const fetchMock = vi.fn();

vi.mock('../../src/stores/toast', () => ({
  toastStore: {
    show: vi.fn(),
  },
}));

vi.mock('../../src/lib/drum/tfjsTranscriber', () => ({
  transcribeInBrowser,
}));

vi.mock('../../src/stores/midi', () => ({
  midiStore: {
    openPreviewFromArrayBuffer,
  },
}));

describe('DrumFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the upload area and keeps the TFJS test ids', () => {
    render(DrumFileUpload);

    expect(screen.getByText(/Drop your drum audio here/i)).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toHaveAttribute('type', 'file');
    expect(
      screen.queryByTestId('tfjs-transcribe-button')
    ).not.toBeInTheDocument();
  });

  it('shows an error toast when the file is too large', async () => {
    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input');
    const largeFile = new File(['x'], 'large.mp3', {
      type: 'audio/mpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 51 * 1024 * 1024 });

    await fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(toastStore.show).toHaveBeenCalledWith(
      'File too large. Maximum size is 50MB.',
      'error'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps a valid file local and does not upload it to a server', async () => {
    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input');
    const file = new File(['beat'], 'beat.wav', { type: 'audio/wav' });

    await fireEvent.change(fileInput, { target: { files: [file] } });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('tfjs-transcribe-button')).toBeInTheDocument();
    expect(screen.queryByText(/Start on Server/i)).not.toBeInTheDocument();
  });

  it('runs the TFJS transcription path and opens the local MIDI preview', async () => {
    transcribeInBrowser.mockResolvedValue(new ArrayBuffer(12));
    openPreviewFromArrayBuffer.mockResolvedValue(true);

    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input');
    const file = new File(['beat'], 'beat.wav', { type: 'audio/wav' });

    await fireEvent.change(fileInput, { target: { files: [file] } });
    await fireEvent.click(screen.getByTestId('tfjs-transcribe-button'));

    await waitFor(() => {
      expect(transcribeInBrowser).toHaveBeenCalledWith(file);
      expect(openPreviewFromArrayBuffer).toHaveBeenCalledWith(
        expect.any(ArrayBuffer)
      );
      expect(toastStore.show).toHaveBeenCalledWith(
        'Transcription complete! Opening preview...',
        'success'
      );
    });
  });

  it('shows an error toast when TFJS transcription fails and recovers state', async () => {
    const error = new Error('Model failed to load');
    transcribeInBrowser.mockRejectedValue(error);

    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input');
    const file = new File(['beat'], 'beat.wav', { type: 'audio/wav' });

    await fireEvent.change(fileInput, { target: { files: [file] } });
    const button = screen.getByTestId('tfjs-transcribe-button');

    // Button should be enabled before clicking
    expect(button).not.toBeDisabled();

    await fireEvent.click(button);

    await waitFor(() => {
      expect(transcribeInBrowser).toHaveBeenCalledWith(file);
      expect(toastStore.show).toHaveBeenCalledWith(
        'TFJS transcription failed: Model failed to load',
        'error'
      );
    });

    // Button should be enabled again after failure
    expect(button).not.toBeDisabled();
  });

  it('shows an error toast when preview fails after successful transcription', async () => {
    transcribeInBrowser.mockResolvedValue(new ArrayBuffer(12));
    openPreviewFromArrayBuffer.mockResolvedValue(false);

    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input');
    const file = new File(['beat'], 'beat.wav', { type: 'audio/wav' });

    await fireEvent.change(fileInput, { target: { files: [file] } });
    await fireEvent.click(screen.getByTestId('tfjs-transcribe-button'));

    await waitFor(() => {
      expect(transcribeInBrowser).toHaveBeenCalledWith(file);
      expect(openPreviewFromArrayBuffer).toHaveBeenCalledWith(
        expect.any(ArrayBuffer)
      );
      expect(toastStore.show).not.toHaveBeenCalledWith(
        'Transcription complete! Opening preview...',
        'success'
      );
      expect(toastStore.show).toHaveBeenCalledWith(
        'Failed to open MIDI preview.',
        'error'
      );
    });
  });
});
