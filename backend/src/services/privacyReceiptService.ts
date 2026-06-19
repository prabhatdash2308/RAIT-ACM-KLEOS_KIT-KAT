import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { ATTRIBUTE_LABELS, TRADITIONAL_DISCLOSURE_FIELDS } from '../utils/attributes';
import { AppError } from '../middleware/errorHandler';
import { AttributeType } from '@prisma/client';

export class PrivacyReceiptService {
  async createReceipt(params: {
    consentId: string;
    userId: string;
    merchantId: string;
    merchantName: string;
    purpose: string;
    requestedAttributes: AttributeType[];
    sharedAttributes: AttributeType[];
    proofIds: string[];
    dpdpCompliant: boolean;
  }) {
    const transactionId = `TXN-${uuidv4().slice(0, 12).toUpperCase()}`;
    const requestedData = params.requestedAttributes.map((a) => ATTRIBUTE_LABELS[a]);
    const sharedData = params.sharedAttributes.map((a) => ATTRIBUTE_LABELS[a]);
    const protectedData = TRADITIONAL_DISCLOSURE_FIELDS.filter(
      (f) => !sharedData.some((s) => f.toLowerCase().includes(s.toLowerCase().split(' ')[0]))
    );

    return prisma.privacyReceipt.create({
      data: {
        transactionId,
        consentId: params.consentId,
        userId: params.userId,
        merchantId: params.merchantId,
        merchantName: params.merchantName,
        purpose: params.purpose,
        requestedData,
        sharedData,
        protectedData,
        dpdpCompliant: params.dpdpCompliant,
        proofIds: params.proofIds,
      },
    });
  }

  async getReceipt(consentId: string, userId: string) {
    const receipt = await prisma.privacyReceipt.findFirst({
      where: { consentId, userId },
    });
    if (!receipt) throw new AppError('Privacy receipt not found', 404);
    return receipt;
  }

  async getReceiptByTransaction(transactionId: string) {
    const receipt = await prisma.privacyReceipt.findUnique({ where: { transactionId } });
    if (!receipt) throw new AppError('Privacy receipt not found', 404);
    return receipt;
  }

  generateReceiptHtml(receipt: {
    transactionId: string;
    merchantName: string;
    purpose: string;
    requestedData: unknown;
    sharedData: unknown;
    protectedData: unknown;
    dpdpCompliant: boolean;
    proofIds: unknown;
    createdAt: Date;
  }) {
    const requested = (receipt.requestedData as string[]).join(', ');
    const shared = (receipt.sharedData as string[]).join(', ');
    const protected_ = (receipt.protectedData as string[]).join(', ');
    const proofIds = (receipt.proofIds as string[]).join(', ');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DigiRakshak Privacy Receipt - ${receipt.transactionId}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 24px; color: #1a1a2e; }
    .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 700; color: #0ea5e9; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .section { margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .value { font-size: 15px; margin-top: 4px; }
    .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🛡️ DigiRakshak</div>
    <p style="margin:4px 0 0;color:#64748b">Privacy Receipt — Prove Only What Matters</p>
  </div>

  <p><span class="label">Transaction ID</span><br><strong>${receipt.transactionId}</strong></p>
  <p><span class="label">Date</span><br>${receipt.createdAt.toISOString()}</p>
  <p><span class="label">DPDP Status</span><br>
    <span class="badge ${receipt.dpdpCompliant ? 'badge-success' : 'badge-warning'}">
      ${receipt.dpdpCompliant ? '✓ DPDP Compliant' : '⚠ Review Required'}
    </span>
  </p>

  <div class="section">
    <div class="label">Merchant</div>
    <div class="value">${receipt.merchantName}</div>
  </div>
  <div class="section">
    <div class="label">Purpose</div>
    <div class="value">${receipt.purpose}</div>
  </div>
  <div class="section">
    <div class="label">Requested Data</div>
    <div class="value">${requested}</div>
  </div>
  <div class="section">
    <div class="label">Shared Data (Derived Proofs Only)</div>
    <div class="value" style="color:#166534">${shared}</div>
  </div>
  <div class="section">
    <div class="label">Protected Data (Never Shared)</div>
    <div class="value" style="color:#0ea5e9">${protected_}</div>
  </div>
  <div class="section">
    <div class="label">PrivacyTrace Proof IDs</div>
    <div class="value" style="font-family:monospace;font-size:13px">${proofIds}</div>
  </div>

  <div class="footer">
    This receipt certifies selective disclosure under DPDP principles.<br>
    No raw Aadhaar or identity documents were shared or stored.<br>
    © 2026 DigiRakshak — Privacy by Design
  </div>
</body>
</html>`;
  }
}

export const privacyReceiptService = new PrivacyReceiptService();
