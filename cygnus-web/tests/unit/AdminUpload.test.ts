import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AdminUpload from '../../src/components/AdminUpload.svelte';

// Mock fetch is not needed for these tests

describe('AdminUpload', () => {
  it('renders the upload form correctly', () => {
    render(AdminUpload);

    expect(screen.getByLabelText(/Song File/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preview Image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Song Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Artist/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/BPM/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Release Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Origin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Is Released/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Song/i })).toBeInTheDocument();
  });

  it('can fill form fields', () => {
    render(AdminUpload);

    const fileInput = screen.getByLabelText(/Song File/i) as HTMLInputElement;
    const songNameInput = screen.getByLabelText(/Song Name/i) as HTMLInputElement;
    const artistInput = screen.getByLabelText(/Artist/i) as HTMLInputElement;
    const bpmInput = screen.getByLabelText(/BPM/i) as HTMLInputElement;
    const releaseDateInput = screen.getByLabelText(/Release Date/i) as HTMLInputElement;
    const originInput = screen.getByLabelText(/Origin/i) as HTMLInputElement;

    // Create a mock file
    const file = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(songNameInput, { target: { value: 'Test Song' } });
    fireEvent.change(artistInput, { target: { value: 'Test Artist' } });
    fireEvent.change(bpmInput, { target: { value: '120' } });
    fireEvent.change(releaseDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(originInput, { target: { value: 'AI Generated' } });

    expect(songNameInput.value).toBe('Test Song');
    expect(artistInput.value).toBe('Test Artist');
    expect(bpmInput.value).toBe('120');
    expect(releaseDateInput.value).toBe('2023-01-01');
    expect(originInput.value).toBe('AI Generated');
  });

  it('has required form validation', () => {
    render(AdminUpload);

    const fileInput = screen.getByLabelText(/Song File/i) as HTMLInputElement;
    const songNameInput = screen.getByLabelText(/Song Name/i) as HTMLInputElement;
    const artistInput = screen.getByLabelText(/Artist/i) as HTMLInputElement;
    const bpmInput = screen.getByLabelText(/BPM/i) as HTMLInputElement;
    const releaseDateInput = screen.getByLabelText(/Release Date/i) as HTMLInputElement;
    const originInput = screen.getByLabelText(/Origin/i) as HTMLInputElement;

    expect(fileInput).toBeRequired();
    expect(songNameInput).toBeRequired();
    expect(artistInput).toBeRequired();
    expect(bpmInput).toBeRequired();
    expect(releaseDateInput).toBeRequired();
    expect(originInput).toBeRequired();
  });
});