import { describe, it, expect } from 'vitest';
import { privacyAssistant } from '../services/privacyAssistant';

describe('AI Privacy Assistant', () => {
  it('flags unnecessary attributes for pharmacy request', () => {
    const analysis = privacyAssistant.analyzeRequest(
      'Age verification for medicine purchase',
      [
        { attribute: 'AGE_OVER_18', reason: 'Required to verify customer is above 18 for medicine purchase' },
        { attribute: 'STATE', reason: 'Need state for marketing' },
      ]
    );
    expect(analysis.unnecessaryAttributes.length).toBeGreaterThan(0);
    expect(['MEDIUM', 'HIGH', 'CRITICAL']).toContain(analysis.riskLevel);
    expect(analysis.explanation).toBeTruthy();
  });

  it('rejects weak reasons with low score', () => {
    const result = privacyAssistant.analyzeReason('Required', 'Age verification');
    expect(result.score).toBeLessThan(30);
    expect(result.verdict).toBe('REJECT');
  });

  it('approves minimal disclosure requests', () => {
    const analysis = privacyAssistant.analyzeRequest(
      'Student discount verification at coffee shop',
      [{ attribute: 'STUDENT', reason: 'Required to verify active student status for 20% discount on beverages' }],
      80
    );
    expect(analysis.recommendation).toBe('APPROVE');
    expect(analysis.unnecessaryAttributes).toHaveLength(0);
    expect(analysis.minimumAttributes).toContain('STUDENT');
  });
});
