import { HttpAgent } from "@dfinity/agent";

export const HOST = "https://ic0.app";

export const IDENTITY_PROVIDER = 'https://identity.ic0.app';

export const defaultAgent = new HttpAgent({
  host: HOST,
});

// Production uses HttpAgent's built-in trusted ICP root key.
// Never fetch and replace that key from an arbitrary mainnet gateway.
// A local-only replica may fetch its own root key in a separate DEV agent.

