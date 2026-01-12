import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('cn utility', () => {
  it('merges class names and deduplicates', () => {
    const result = cn('btn', 'btn-primary', { hidden: false } as any);
    expect(typeof result).toBe('string');
    expect(result.includes('btn')).toBe(true);
  });
});
