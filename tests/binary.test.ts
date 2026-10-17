import { describe, expect, it } from 'vitest';
import { copyBytesToArrayBuffer } from '../src/lib/binary';

describe('copyBytesToArrayBuffer', () => {
  it('copies only the viewed bytes from a non-zero-offset subview', () => {
    const source = new Uint8Array([10, 20, 30, 40, 50]);
    const view = source.subarray(1, 4);
    const copy = copyBytesToArrayBuffer(view);

    expect(Array.from(new Uint8Array(copy))).toEqual([20, 30, 40]);
    expect(copy).not.toBe(source.buffer);
  });

  it('copies bytes backed by SharedArrayBuffer when available', () => {
    if (typeof SharedArrayBuffer === 'undefined') return;

    const shared = new SharedArrayBuffer(5);
    const source = new Uint8Array(shared);
    source.set([1, 2, 3, 4, 5]);
    const copy = copyBytesToArrayBuffer(source.subarray(1, 4));

    expect(copy).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(copy))).toEqual([2, 3, 4]);
  });
});
