import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export const ATTRIBUTE_LABELS: Record<string, string> = {
  AGE_OVER_18: 'Age Above 18',
  STATE: 'State Residency',
  STATE_RESIDENCY: 'State Residency',
  FEMALE: 'Female Status',
  FEMALE_STATUS: 'Female Status',
  STUDENT: 'Student Status',
  STUDENT_STATUS: 'Student Status',
  IDENTITY_VERIFIED: 'Identity Verified',
  PINCODE_MATCH: 'Pincode Match',
};

export const ATTRIBUTE_PUBLIC_NAMES: Record<string, string> = {
  AGE_OVER_18: 'AGE_OVER_18',
  STATE: 'STATE_RESIDENCY',
  FEMALE: 'FEMALE_STATUS',
  STUDENT: 'STUDENT_STATUS',
  IDENTITY_VERIFIED: 'IDENTITY_VERIFIED',
  PINCODE_MATCH: 'PINCODE_MATCH',
};

export const PRIVACY_PRINCIPLES = [
  { title: 'Data Minimization', description: 'Share only what is absolutely necessary' },
  { title: 'Purpose Limitation', description: 'Data used only for stated purpose' },
  { title: 'User Consent', description: 'You control every disclosure' },
  { title: 'Zero Aadhaar Storage', description: 'We never store your Aadhaar number' },
  { title: 'Transparency', description: 'See exactly what merchants request' },
  { title: 'Privacy by Design', description: 'Built from the ground up for privacy' },
];
