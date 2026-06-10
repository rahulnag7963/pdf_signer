import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ scale: vi.fn() })) as never;

describe('SignatureModal', () => {
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
});
