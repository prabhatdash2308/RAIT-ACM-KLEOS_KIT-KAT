import { describe, it, expect } from 'vitest';
import { ATTRIBUTE_LABELS } from '../lib/utils';

describe('Frontend Utils', () => {
  it('has all attribute labels defined', () => {
    expect(ATTRIBUTE_LABELS.AGE_OVER_18).toBe('Age Above 18');
    expect(ATTRIBUTE_LABELS.IDENTITY_VERIFIED).toBe('Identity Verified');
    expect(Object.keys(ATTRIBUTE_LABELS)).toHaveLength(6);
  });
});
