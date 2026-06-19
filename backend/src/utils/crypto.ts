import CryptoJS from 'crypto-js';
import { config } from '../config';

export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
}

export function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, config.aesKey).toString();
}

export function decryptData(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, config.aesKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function generateNonce(): string {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
}

export function generateSignature(payload: string): string {
  return CryptoJS.HmacSHA256(payload, config.aesKey).toString(CryptoJS.enc.Hex);
}

export function verifySignature(payload: string, signature: string): boolean {
  const expected = generateSignature(payload);
  return expected === signature;
}
