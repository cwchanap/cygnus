import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AdminUpload from '../../src/components/AdminUpload.svelte';

describe('AdminUpload', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/admin/categories') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ categories: [] }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Uploaded successfully' }),
        });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
    expect(
      screen.getByRole('button', { name: /Upload Song/i })
    ).toBeInTheDocument();
  });

  it('can fill form fields', () => {
    render(AdminUpload);

    const fileInput = screen.getByLabelText(/Song File/i) as HTMLInputElement;
    const songNameInput = screen.getByLabelText(
      /Song Name/i
    ) as HTMLInputElement;
    const artistInput = screen.getByLabelText(/Artist/i) as HTMLInputElement;
    const bpmInput = screen.getByLabelText(/BPM/i) as HTMLInputElement;
    const releaseDateInput = screen.getByLabelText(
      /Release Date/i
    ) as HTMLInputElement;
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
    const songNameInput = screen.getByLabelText(
      /Song Name/i
    ) as HTMLInputElement;
    const artistInput = screen.getByLabelText(/Artist/i) as HTMLInputElement;
    const bpmInput = screen.getByLabelText(/BPM/i) as HTMLInputElement;
    const releaseDateInput = screen.getByLabelText(
      /Release Date/i
    ) as HTMLInputElement;
    const originInput = screen.getByLabelText(/Origin/i) as HTMLInputElement;

    expect(fileInput).toBeRequired();
    expect(songNameInput).toBeRequired();
    expect(artistInput).toBeRequired();
    expect(bpmInput).toBeRequired();
    expect(releaseDateInput).toBeRequired();
    expect(originInput).toBeRequired();
  });

  it('shows a required category select when categories exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/admin/categories') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                categories: [
                  { id: 1, name: 'Drum and Bass' },
                  { id: 2, name: 'House' },
                ],
              }),
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Uploaded successfully' }),
        });
      })
    );

    render(AdminUpload);

    const select = (await screen.findByLabelText(
      /Category/i
    )) as HTMLSelectElement;
    await waitFor(() => {
      expect(select).toBeRequired();
    });
    expect(select.name).toBe('categoryId');
    expect(
      screen.getByRole('option', { name: /Select category/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Drum and Bass' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'House' })).toBeInTheDocument();
  });

  it('allows uncategorized uploads when no categories exist', async () => {
    render(AdminUpload);

    const select = (await screen.findByLabelText(
      /Category/i
    )) as HTMLSelectElement;
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /No configured categories/i })
      ).toBeInTheDocument();
    });
    expect(select).not.toBeRequired();
  });

  it('shows an error and disables submit when category loading fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Server Error',
        json: () => Promise.resolve({ message: 'Could not load categories' }),
      })
    );

    render(AdminUpload);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not load categories/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Upload Song/i })).toBeDisabled();
  });

  it('disables submit while categories are loading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/admin/categories') {
          return new Promise(() => {});
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Uploaded successfully' }),
        });
      })
    );

    render(AdminUpload);

    expect(screen.getByRole('button', { name: /Upload Song/i })).toBeDisabled();
    expect(
      screen.getByRole('option', { name: /Loading categories/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /No configured categories/i })
    ).not.toBeInTheDocument();
  });
});
