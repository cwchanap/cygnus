import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

// vi.mock is hoisted before variable declarations, so we use vi.hoisted
// to create the store mock that can be referenced in the factory.
const storeMocks = vi.hoisted(() => {
  type Toast = { id: string; message: string; type: string };
  let _subscribers: Array<(v: Toast[]) => void> = [];
  let _value: Toast[] = [];

  const subscribe = (fn: (v: Toast[]) => void) => {
    _subscribers.push(fn);
    fn(_value);
    return () => {
      _subscribers = _subscribers.filter((s) => s !== fn);
    };
  };

  const set = (v: Toast[]) => {
    _value = v;
    for (const sub of _subscribers) sub(v);
  };

  const mockRemove = vi.fn((id: string) => {
    set(_value.filter((t) => t.id !== id));
  });

  return { subscribe, set, mockRemove };
});

vi.mock('../../src/stores/toast', () => ({
  toastStore: {
    subscribe: storeMocks.subscribe,
    show: vi.fn(),
    remove: storeMocks.mockRemove,
  },
}));

import DrumToast from '../../src/components/DrumToast.svelte';

describe('DrumToast', () => {
  beforeEach(() => {
    storeMocks.set([]);
    vi.clearAllMocks();
  });

  it('renders nothing when toast store is empty', () => {
    render(DrumToast);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a toast message', () => {
    storeMocks.set([{ id: '1', message: 'Upload complete', type: 'success' }]);
    render(DrumToast);
    expect(screen.getByText('Upload complete')).toBeInTheDocument();
  });

  it('renders a success toast', () => {
    storeMocks.set([{ id: '1', message: 'Done!', type: 'success' }]);
    render(DrumToast);
    expect(screen.getByText('Done!')).toBeInTheDocument();
  });

  it('renders an error toast', () => {
    storeMocks.set([
      { id: '2', message: 'Something went wrong', type: 'error' },
    ]);
    render(DrumToast);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders an info toast', () => {
    storeMocks.set([{ id: '3', message: 'Processing...', type: 'info' }]);
    render(DrumToast);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders a close button for each toast', () => {
    storeMocks.set([
      { id: '1', message: 'First', type: 'success' },
      { id: '2', message: 'Second', type: 'error' },
    ]);
    render(DrumToast);
    const buttons = screen.getAllByRole('button', {
      name: /close notification/i,
    });
    expect(buttons).toHaveLength(2);
  });

  it('calls toastStore.remove with the toast id when close button is clicked', async () => {
    storeMocks.set([{ id: 'toast-abc', message: 'Dismiss me', type: 'info' }]);
    render(DrumToast);
    const closeBtn = screen.getByRole('button', {
      name: /close notification/i,
    });
    await fireEvent.click(closeBtn);
    expect(storeMocks.mockRemove).toHaveBeenCalledWith('toast-abc');
  });

  it('renders multiple toasts simultaneously', () => {
    storeMocks.set([
      { id: '1', message: 'Toast A', type: 'success' },
      { id: '2', message: 'Toast B', type: 'error' },
      { id: '3', message: 'Toast C', type: 'info' },
    ]);
    render(DrumToast);
    expect(screen.getByText('Toast A')).toBeInTheDocument();
    expect(screen.getByText('Toast B')).toBeInTheDocument();
    expect(screen.getByText('Toast C')).toBeInTheDocument();
  });
});
