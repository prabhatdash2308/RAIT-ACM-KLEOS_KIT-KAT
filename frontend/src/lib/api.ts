const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || 'Request failed', res.status);
  }

  return data.data as T;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; type: string };
}

export const authApi = {
  citizenLogin: (email: string, password: string) =>
    api<AuthResponse>('/auth/citizen/login', { method: 'POST', body: { email, password } }),
  citizenRegister: (data: { email: string; password: string; name: string; phone?: string }) =>
    api<AuthResponse>('/auth/citizen/register', { method: 'POST', body: data }),
  merchantLogin: (email: string, password: string) =>
    api<AuthResponse>('/auth/merchant/login', { method: 'POST', body: { email, password } }),
  merchantRegister: (data: { email: string; password: string; businessName: string; gstNumber?: string; businessType: string }) =>
    api<AuthResponse>('/auth/merchant/register', { method: 'POST', body: data }),
  adminLogin: (email: string, password: string) =>
    api<AuthResponse>('/auth/admin/login', { method: 'POST', body: { email, password } }),
};

export interface WalletData {
  wallet: {
    identityVerified: boolean;
    ageOver18: boolean;
    state: string | null;
    isFemale: boolean;
    isStudent: boolean;
    pincodeMasked: string | null;
  } | null;
  hasWallet: boolean;
}

export const walletApi = {
  get: (token: string) => api<WalletData>('/wallet', { token }),
  importMock: (token: string) => api('/wallet/import-mock', { method: 'POST', token }),
  demoMode: (token: string) => api('/wallet/demo-mode', { method: 'POST', token }),
  digilocker: (token: string) => api('/wallet/digilocker/connect', { method: 'POST', token }),
  history: (token: string) => api('/wallet/history', { token }),
  revoke: (token: string, id: string) => api(`/wallet/history/${id}/revoke`, { method: 'POST', token }),
  exportHistory: (token: string, format: 'json' | 'csv' = 'json') =>
    api(`/wallet/history/export?format=${format}`, { token }),
};

export const verificationApi = {
  createRequest: (token: string, data: { purpose: string; attributes: { attribute: string; reason: string; pincodeValue?: string }[] }) =>
    api('/verification/request', { method: 'POST', body: data, token }),
  decodeQr: (token: string, qrPayload: string) =>
    api('/verification/decode-qr', { method: 'POST', body: { qrPayload }, token }),
  approve: (token: string, requestId: string, mode?: string) =>
    api('/verification/consent/approve', { method: 'POST', body: { requestId, mode }, token }),
  shareMinimum: (token: string, requestId: string) =>
    api('/verification/consent/share-minimum', { method: 'POST', body: { requestId }, token }),
  approveAnyway: (token: string, requestId: string) =>
    api('/verification/consent/approve-anyway', { method: 'POST', body: { requestId }, token }),
  reject: (token: string, requestId: string) =>
    api('/verification/consent/reject', { method: 'POST', body: { requestId }, token }),
  verifyProof: (token: string, proofHash: string) =>
    api('/verification/verify-proof', { method: 'POST', body: { proofHash }, token }),
  results: (token: string, requestId: string) =>
    api(`/verification/results/${requestId}`, { token }),
  auditLogs: (token: string) => api('/verification/audit-logs', { token }),
};

export interface CitizenDashboard {
  privacyScore: number;
  privacyLevel?: string;
  monthlyTrend: { month: string; score: number }[];
  transactions: number;
  protectedFields: number;
  sharedFields?: number;
  mostTrustedMerchant: string;
  dataSavedKb: number;
  aiSuggestions?: string[];
  recentTransactions: { merchant: string; attribute: string; status: string; time: string }[];
  wallet: Record<string, unknown> | null;
}

export interface MerchantDashboard {
  totalRequests: number;
  successRate: number;
  privacyCompliance: number;
  trustScore: number;
  trustStars?: number;
  approvalRate?: number;
  reasonQuality?: number;
  minimalDisclosure?: number;
  complaints?: number;
  trend?: number;
  recentTransactions: { attribute: string; proofValue: string; status: string; time: string }[];
}

export interface TransparencyData {
  transparencyScore: number;
  disclosurePreventedPercent: number;
  privacySavedKb: number;
  protectedAttributes: number;
  sharedAttributes: number;
  traditionalFields: string[];
  requestedVsShared?: { requested: string[]; shared: string[]; traditional: string[] };
  recentLogs: unknown[];
}

export interface AdminDashboard {
  totalCitizens: number;
  totalMerchants: number;
  totalTransactions: number;
  totalAuditLogs: number;
  privacyComplianceRate: number;
}

export const analyticsApi = {
  citizenDashboard: (token: string) => api<CitizenDashboard>('/analytics/citizen/dashboard', { token }),
  citizenTransparency: (token: string) => api<TransparencyData>('/analytics/citizen/transparency', { token }),
  merchantDashboard: (token: string) => api<MerchantDashboard>('/analytics/merchant/dashboard', { token }),
  merchantAnalytics: (token: string) => api('/analytics/merchant/analytics', { token }),
  adminDashboard: (token: string) => api<AdminDashboard>('/analytics/admin/dashboard', { token }),
  adminMerchants: (token: string) => api('/analytics/admin/merchants', { token }),
  adminCitizens: (token: string) => api('/analytics/admin/citizens', { token }),
  adminAuditLogs: (token: string) => api('/analytics/admin/audit-logs', { token }),
};
