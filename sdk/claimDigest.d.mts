export function canonicalizeJson(value: unknown): string;
export function computeClaimDigest(claimBody: Record<string, unknown>): Promise<string>;
export function hexToBytes(hex: string): Uint8Array;
export function bytesToHex(bytes: Uint8Array): string;
