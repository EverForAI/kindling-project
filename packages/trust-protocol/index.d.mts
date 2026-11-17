export const TRUST_ALGORITHM: 'ECDSA-P256-SHA256-P1363';
export const RECEIPT_FORMAT: 'kindling-receipt-1';
export const CHALLENGE_FORMAT: 'kindling-challenge-v1';
export const CHALLENGE_RESPONSE_FORMAT: 'kindling-challenge-response-v1';
export const CHALLENGE_TTL_MS: number;
export const MAX_RECEIPT_BYTES: number;
export interface VerifiedReceipt {
  id: string;
  identityId: string;
  authorPublicKey: JsonWebKey;
  text: string;
  nickname: string;
  status: string;
  receivedAt: string;
  issuedAt: string;
  platformKeyId: string;
  platformPinned: boolean;
  releases: unknown[];
  receipt: Record<string, unknown>;
}
export function fingerprintPublicKey(key: JsonWebKey): Promise<string>;
export function fingerprintText(value: string): Promise<string>;
export function verifyReceiptEnvelope(envelope: unknown, trustedPlatformKeyId?: string): Promise<VerifiedReceipt>;
export function createIdentityChallenge(identityId: string, now?: number): Promise<Record<string, string>>;
export function signIdentityChallenge(challenge: unknown, vault: unknown, password: string, now?: number): Promise<Record<string, unknown>>;
export function verifyIdentityChallengeResponse(response: unknown, options: { challengeEnvelope: unknown; receiptInfo: VerifiedReceipt; now?: number }): Promise<{ verified: true; challengeId: string; identityId: string; verifiedAt: string }>;
