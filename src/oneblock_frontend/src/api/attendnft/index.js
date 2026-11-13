import { Actor, HttpAgent } from "@dfinity/agent";

// Imports and re-exports candid interface
import { idlFactory } from './attendnft.did.js';
export { idlFactory } from './attendnft.did.js';
// CANISTER_ID is replaced by webpack based on node environment
export const canisterId = "rvzx7-oqaaa-aaaaj-qagxq-cai";

/**
 * 
 * @param {string | import("@dfinity/principal").Principal} canisterId Canister ID of Agent
 * @param {{agentOptions?: import("@dfinity/agent").HttpAgentOptions; actorOptions?: import("@dfinity/agent").ActorConfig}} [options]
 * @return {import("@dfinity/agent").ActorSubclass<import("./attendnft.did.js")._SERVICE>}
 */
 export const createActor = (agent, actorOptions) => {
  // const agent = new HttpAgent({ ...options?.agentOptions });
  
  // Callers must supply a trusted agent; never fetch a root key implicitly.

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    actorOptions
  });
};
  
/**
 * A ready-to-use agent for the attendnft canister
 * @type {import("@dfinity/agent").ActorSubclass<import("./attendnft.did.js")._SERVICE>}
 */
//  export const attendnft = createActor(canisterId);
