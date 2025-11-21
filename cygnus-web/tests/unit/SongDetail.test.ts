import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SongDetail from '../../src/components/SongDetail.svelte';

describe('SongDetail', () => {
  const mockSong = {
    id: '1',
    title: 'Test Song',
    origin: 'AI Generated',
    bpm: 120,
    releaseDate: '2023-01-01',
    previewImage: 'test.jpg',
  };

  it('renders song details when song is provided', () => {
    render(SongDetail, { props: { song: mockSong } });

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Created with AI Generated')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
  });

  it('renders placeholder when no song is provided', () => {
    render(SongDetail, { props: { song: null } });

    expect(screen.getByText('Select a Song')).toBeInTheDocument();
    expect(screen.getByText('Choose a composition from the list to view details')).toBeInTheDocument();
  });

  it('renders play button when song is provided', () => {
    render(SongDetail, { props: { song: mockSong } });

    expect(screen.getByRole('button', { name: /Play Preview/i })).toBeInTheDocument();
  });
});