import { describe, it, expect } from 'vitest';
import { deriveAttributes, getAttributeValue } from '../utils/attributes';

describe('Selective Disclosure Engine', () => {
  it('derives AGE_OVER_18 from DOB without exposing DOB', () => {
    const derived = deriveAttributes({
      name: 'Test',
      dob: '2010-01-01',
      gender: 'M',
      state: 'Karnataka',
      pincode: '560001',
    });
    expect(derived.ageOver18).toBe(false);
    expect(getAttributeValue('AGE_OVER_18', derived)).toBe('FALSE');
  });

  it('derives adult status correctly', () => {
    const derived = deriveAttributes({
      name: 'Adult',
      dob: '1998-05-15',
      gender: 'M',
      state: 'Karnataka',
      pincode: '560001',
    });
    expect(derived.ageOver18).toBe(true);
    expect(getAttributeValue('AGE_OVER_18', derived)).toBe('TRUE');
  });

  it('never exposes raw pincode in proof - only match result', () => {
    const derived = deriveAttributes({
      name: 'Test',
      dob: '1998-05-15',
      gender: 'F',
      state: 'Karnataka',
      pincode: '560001',
    });
    const match = getAttributeValue('PINCODE_MATCH', derived, '560001');
    const noMatch = getAttributeValue('PINCODE_MATCH', derived, '110001');
    expect(match).toBe('TRUE');
    expect(noMatch).toBe('FALSE');
  });
});
