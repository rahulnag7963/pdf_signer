import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignatureModal } from '@/components/SignatureModal';

vi.mock('signature_pad', () => ({
  // SignaturePad is instantiated with `new`, so the mock must be constructible.
  default: class {
    isEmpty = () => true;
    toDataURL = () => '';
    clear = vi.fn();
    off = vi.fn();
  },
}));

vi.mock('@/lib/rasterize', () => ({
  typedSignatureToPng: vi.fn(async () => 'data:image/png;base64,TYPED'),
}));

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ scale: vi.fn() })) as never;

/** Switch to the Type tab and enter a name. */
function typeName(name: string) {
  fireEvent.click(screen.getByText('Type'));
  fireEvent.change(screen.getByPlaceholderText('Type your name'), { target: { value: name } });
}

describe('SignatureModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the Draw tab by default and switches to Type', () => {
    render(<SignatureModal onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Clear')).toBeTruthy();
    fireEvent.click(screen.getByText('Type'));
    expect(screen.getByPlaceholderText('Type your name')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<SignatureModal onConfirm={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('confirms a typed signature and saves it to localStorage', async () => {
    const onConfirm = vi.fn();
    render(<SignatureModal onConfirm={onConfirm} onClose={vi.fn()} />);
    typeName('Rahul Nag');
    fireEvent.click(screen.getByText('Add signature'));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith('data:image/png;base64,TYPED'),
    );
    const raw = localStorage.getItem('pdf-signer.signature');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).dataUrl).toBe('data:image/png;base64,TYPED');
  });

  it('warns instead of confirming when saving fails, then confirms on the next click', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const onConfirm = vi.fn();
    render(<SignatureModal onConfirm={onConfirm} onClose={vi.fn()} />);
    typeName('Rahul Nag');

    fireEvent.click(screen.getByText('Add signature'));
    await screen.findByText(/Couldn't save to this browser/);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Add signature'));
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith('data:image/png;base64,TYPED'),
    );
  });

  it('does not close when a press starts inside the dialog and releases on the backdrop', () => {
    const onClose = vi.fn();
    render(<SignatureModal onConfirm={vi.fn()} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement!;
    // Pen stroke starts inside the dialog, releases over the backdrop: the
    // browser dispatches click on the common ancestor (the overlay).
    fireEvent.pointerDown(dialog);
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when a press starts and ends on the backdrop', () => {
    const onClose = vi.fn();
    render(<SignatureModal onConfirm={vi.fn()} onClose={onClose} />);
    const overlay = screen.getByRole('dialog').parentElement!;
    fireEvent.pointerDown(overlay);
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<SignatureModal onConfirm={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
