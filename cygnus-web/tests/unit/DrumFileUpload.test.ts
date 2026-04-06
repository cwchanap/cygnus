import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DrumFileUpload from '../../src/components/DrumFileUpload.svelte';

vi.mock('../../src/stores/toast', () => ({
  toastStore: {
    show: vi.fn(),
  },
}));

describe('DrumFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload area correctly', () => {
    render(DrumFileUpload);

    expect(screen.getByText(/Drop your drum audio here/i)).toBeInTheDocument();
    expect(screen.getByText(/MP3.*WAV.*M4A.*FLAC/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Choose File/i })).toBeInTheDocument();
  });

  it('shows file input with correct attributes', () => {
    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.mp3,.wav,.m4a,.flac,audio/*');
  });

  it('does not show the TFJS transcribe button before a file is selected', () => {
    render(DrumFileUpload);

    expect(screen.queryByTestId('tfjs-transcribe-button')).not.toBeInTheDocument();
  });

  it('shows the TFJS transcribe button after a valid file is selected', async () => {
    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    const testFile = new File(['audio content'], 'drums.mp3', { type: 'audio/mpeg' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(await screen.findByTestId('tfjs-transcribe-button')).toBeInTheDocument();
  });

  it('shows the selected filename after a file is chosen', async () => {
    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    const testFile = new File(['audio content'], 'my-drums.mp3', { type: 'audio/mpeg' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(await screen.findByText('my-drums.mp3')).toBeInTheDocument();
  });

  it('shows error toast for oversized files and keeps drop zone visible', async () => {
    const { toastStore } = await import('../../src/stores/toast');
    render(DrumFileUpload);

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
    const oversizedFile = new File(['x'], 'huge.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(oversizedFile, 'size', { value: 51 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(toastStore.show).toHaveBeenCalledWith(expect.stringContaining('too large'), 'error');
    // Drop zone should still be visible (file was rejected)
    expect(screen.getByText(/Drop your drum audio here/i)).toBeInTheDocument();
  });

  it('handles drag and drop events', () => {
    render(DrumFileUpload);

    const dropZone = screen.getByText(/Drop your drum audio here/i).closest('div');
    fireEvent.dragOver(dropZone!, { preventDefault: () => {} });

    expect(screen.getByText(/Drop your drum audio here/i)).toBeInTheDocument();
  });
});