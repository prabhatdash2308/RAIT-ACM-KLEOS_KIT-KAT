import { AttributeType } from '@prisma/client';
import { ATTRIBUTE_LABELS, TRADITIONAL_DISCLOSURE_FIELDS } from '../utils/attributes';

export interface PrivacyAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  privacyScorePreview: number;
  unnecessaryAttributes: string[];
  minimumAttributes: AttributeType[];
  reasonScores: { attribute: string; score: number; feedback: string; verdict: string }[];
  summary: string;
  explanation: string;
  transparency: {
    traditionalFields: string[];
    requestedFields: string[];
    minimumShareFields: string[];
    disclosurePreventedPercent: number;
    privacySavedKb: number;
  };
}

const ATTRIBUTE_NECESSITY: Record<string, AttributeType[]> = {
  pharmacy: ['AGE_OVER_18'],
  hotel: ['STATE'],
  coffee: ['STUDENT'],
  bank: ['IDENTITY_VERIFIED'],
  general: ['IDENTITY_VERIFIED'],
};

const WEAK_REASON_PATTERNS = /^(required|needed|for verification|verify|check)$/i;

export class PrivacyAssistant {
  analyzeReason(reason: string, purpose: string): { score: number; feedback: string; verdict: string } {
    const trimmed = reason.trim();
    if (trimmed.length < 5 || WEAK_REASON_PATTERNS.test(trimmed)) {
      return { score: 15, feedback: 'Reason is too vague. Merchants must explain the specific purpose.', verdict: 'REJECT' };
    }
    if (trimmed.length < 15) {
      return { score: 35, feedback: 'Reason lacks context. Request a clearer business justification.', verdict: 'REVIEW' };
    }
    if (trimmed.length < 40) {
      return { score: 65, feedback: 'Acceptable reason but could be more specific to the stated purpose.', verdict: 'REVIEW' };
    }
    const purposeWords = purpose.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const reasonWords = trimmed.toLowerCase();
    const overlap = purposeWords.filter((w) => reasonWords.includes(w)).length;
    if (overlap >= 2 && trimmed.length >= 40) {
      return { score: 98, feedback: 'Excellent — reason clearly ties to the stated verification purpose.', verdict: 'APPROVE' };
    }
    if (trimmed.length >= 60) {
      return { score: 85, feedback: 'Good detailed reason with adequate business context.', verdict: 'APPROVE' };
    }
    return { score: 55, feedback: 'Reason is acceptable but purpose alignment could be stronger.', verdict: 'REVIEW' };
  }

  getExpectedAttributes(purpose: string): AttributeType[] {
    const p = purpose.toLowerCase();
    if (p.includes('pharmacy') || p.includes('medicine') || p.includes('age') || p.includes('drinking')) {
      return ATTRIBUTE_NECESSITY.pharmacy;
    }
    if (p.includes('hotel') || p.includes('state') || p.includes('residency')) {
      return ATTRIBUTE_NECESSITY.hotel;
    }
    if (p.includes('student') || p.includes('coffee') || p.includes('discount')) {
      return ATTRIBUTE_NECESSITY.coffee;
    }
    if (p.includes('bank') || p.includes('identity') || p.includes('kyc')) {
      return ATTRIBUTE_NECESSITY.bank;
    }
    return ATTRIBUTE_NECESSITY.general;
  }

  analyzeRequest(
    purpose: string,
    attributes: { attribute: AttributeType; reason: string }[],
    merchantTrustScore = 50
  ): PrivacyAnalysis {
    const expectedAttrs = this.getExpectedAttributes(purpose);
    const requestedAttrs = attributes.map((a) => a.attribute);
    const unnecessaryAttrs = requestedAttrs.filter((a) => !expectedAttrs.includes(a));
    const minimumAttributes = requestedAttrs.filter((a) => expectedAttrs.includes(a));
    const unnecessaryLabels = unnecessaryAttrs.map((a) => ATTRIBUTE_LABELS[a]);

    const reasonScores = attributes.map((a) => {
      const analysis = this.analyzeReason(a.reason, purpose);
      return { attribute: ATTRIBUTE_LABELS[a.attribute], ...analysis };
    });

    const avgReasonScore = reasonScores.reduce((s, r) => s + r.score, 0) / (reasonScores.length || 1);
    const unnecessaryPenalty = unnecessaryAttrs.length * 18;
    const weakReasonPenalty = reasonScores.filter((r) => r.score < 40).length * 12;
    const trustBonus = (merchantTrustScore - 50) * 0.15;

    const privacyScorePreview = Math.round(
      Math.max(0, Math.min(100, 100 - unnecessaryPenalty - weakReasonPenalty + trustBonus))
    );

    let riskLevel: PrivacyAnalysis['riskLevel'] = 'LOW';
    if (unnecessaryAttrs.length >= 3 || avgReasonScore < 25) riskLevel = 'CRITICAL';
    else if (unnecessaryAttrs.length >= 2 || avgReasonScore < 40) riskLevel = 'HIGH';
    else if (unnecessaryAttrs.length >= 1 || avgReasonScore < 60) riskLevel = 'MEDIUM';

    let recommendation: PrivacyAnalysis['recommendation'] = 'APPROVE';
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') recommendation = 'REJECT';
    else if (riskLevel === 'MEDIUM') recommendation = 'REVIEW';

    const minimumShareFields = minimumAttributes.map((a) => ATTRIBUTE_LABELS[a]);
    const requestedFields = requestedAttrs.map((a) => ATTRIBUTE_LABELS[a]);
    const disclosurePrevented = Math.round(
      ((TRADITIONAL_DISCLOSURE_FIELDS.length - requestedFields.length) / TRADITIONAL_DISCLOSURE_FIELDS.length) * 100
    );

    const explanation =
      unnecessaryLabels.length > 0
        ? `Only ${minimumShareFields.join(', ') || 'minimal proofs'} ${minimumShareFields.length === 1 ? 'is' : 'are'} required for this transaction. Sharing ${unnecessaryLabels.join(', ')} is unnecessary and increases privacy risk. Traditional Aadhaar verification would expose ${TRADITIONAL_DISCLOSURE_FIELDS.slice(0, 4).join(', ')}, and more.`
        : `This request follows data minimization principles. Only ${requestedFields.join(', ')} ${requestedFields.length === 1 ? 'is' : 'are'} needed for "${purpose}". No unnecessary identity fields requested.`;

    const summary =
      unnecessaryLabels.length > 0
        ? `${unnecessaryLabels.length} unnecessary attribute(s) detected. Recommend sharing minimum only.`
        : `Aligned with purpose limitation for "${purpose}". Safe to approve.`;

    return {
      riskLevel,
      recommendation,
      privacyScorePreview,
      unnecessaryAttributes: unnecessaryLabels,
      minimumAttributes: minimumAttributes.length > 0 ? minimumAttributes : requestedAttrs.slice(0, 1),
      reasonScores,
      summary,
      explanation,
      transparency: {
        traditionalFields: TRADITIONAL_DISCLOSURE_FIELDS,
        requestedFields,
        minimumShareFields,
        disclosurePreventedPercent: Math.max(disclosurePrevented, 75),
        privacySavedKb: TRADITIONAL_DISCLOSURE_FIELDS.length * 1.5,
      },
    };
  }

  getPrivacySuggestions(score: number, unnecessaryCount: number): string[] {
    const suggestions: string[] = [];
    if (score < 70) suggestions.push('Prefer "Share Minimum" when merchants request extra attributes.');
    if (unnecessaryCount > 0) suggestions.push('Reject requests that ask for data beyond the stated purpose.');
    if (score >= 85) suggestions.push('Great privacy hygiene! Keep using selective disclosure.');
    suggestions.push('Review merchant trust scores before approving high-risk requests.');
    suggestions.push('Revoke access for merchants you no longer trust.');
    return suggestions.slice(0, 4);
  }
}

export const privacyAssistant = new PrivacyAssistant();
