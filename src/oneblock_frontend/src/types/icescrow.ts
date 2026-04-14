/**
 * IceScrow integration constants and schema for OneBlock.
 *
 * IceScrow is a decentralized escrow service on the Internet Computer that lets
 * users give away items to other users. Every completed giveaway is submitted
 * to OneBlock as an ActivityRecord so it appears on the giver's public profile.
 *
 * Integration flow
 * ────────────────
 * 1. Admin calls `registerApp` once with ICESCROW_APP.
 * 2. IceScrow calls `registerActivityType` once with ICESCROW_GIVEAWAY_TYPE.
 * 3. When a user gives away an item the IceScrow canister calls
 *    `connectApp` (if the user has not consented yet) and then
 *    `submitActivityRecord` with a record shaped like ICESCROW_GIVEAWAY_RECORD_EXAMPLE.
 * 4. OneBlock updates the DerivedSummary for (profile_id, "icescrow", "giveaway.item")
 *    automatically — no further work needed.
 */

import type {
  AppCategory,
  AppId,
  ActivityTypeKey,
  FieldDef,
  MetadataEntry,
  NewIntegrationApp,
  NewActivityType,
  NewActivityRecord,
  VerificationPolicy,
  Visibility,
} from './integration';

// ── App identity ─────────────────────────────────────────────────────────────

export const ICESCROW_APP_ID: AppId = 'icescrow';

export const ICESCROW_APP: NewIntegrationApp = {
  id: ICESCROW_APP_ID,
  name: 'IceScrow',
  description:
    'Decentralized escrow service on the Internet Computer for trustless item giveaways between users.',
  category: { escrow: null } satisfies AppCategory,
  verification_policy: { idempotency_only: null } satisfies VerificationPolicy,
};

// ── Activity type: giveaway.item ──────────────────────────────────────────────

export const ICESCROW_GIVEAWAY_TYPE_KEY: ActivityTypeKey = 'giveaway.item';

/** Payload field names used in every giveaway ActivityRecord. */
export const ICESCROW_FIELDS = {
  ESCROW_ID: 'escrow_id',
  ITEM_TITLE: 'item_title',
  ITEM_CATEGORY: 'item_category',
  ITEM_CONDITION: 'item_condition',
  QUANTITY: 'quantity',
  RECEIVER_PROFILE_ID: 'receiver_profile_id',
  ESCROW_STATUS: 'escrow_status',
  PROOF_URL: 'proof_url',
} as const;

/** Allowed values for the `escrow_status` payload field. */
export type EscrowStatus = 'completed' | 'cancelled' | 'disputed';

const GIVEAWAY_FIELD_DEFS: FieldDef[] = [
  {
    name: ICESCROW_FIELDS.ESCROW_ID,
    field_type: 'text',
    required: true,
    description: 'Unique IceScrow escrow identifier.',
  },
  {
    name: ICESCROW_FIELDS.ITEM_TITLE,
    field_type: 'text',
    required: true,
    description: 'Title or name of the item being given away.',
  },
  {
    name: ICESCROW_FIELDS.ITEM_CATEGORY,
    field_type: 'text',
    required: false,
    description: 'Category of the item (e.g. electronics, clothing, books).',
  },
  {
    name: ICESCROW_FIELDS.ITEM_CONDITION,
    field_type: 'text',
    required: false,
    description: 'Condition of the item (e.g. new, like-new, used).',
  },
  {
    name: ICESCROW_FIELDS.QUANTITY,
    field_type: 'nat',
    required: false,
    description: 'Number of units given away (defaults to 1).',
  },
  {
    name: ICESCROW_FIELDS.RECEIVER_PROFILE_ID,
    field_type: 'text',
    required: false,
    description: 'OneBlock profile ID of the receiver (omit if anonymous).',
  },
  {
    name: ICESCROW_FIELDS.ESCROW_STATUS,
    field_type: 'text',
    required: true,
    description: 'Final escrow status: completed | cancelled | disputed.',
  },
  {
    name: ICESCROW_FIELDS.PROOF_URL,
    field_type: 'text',
    required: false,
    description: 'URL to delivery proof (photo, receipt, or on-chain tx link).',
  },
];

export const ICESCROW_GIVEAWAY_TYPE: NewActivityType = {
  app_id: ICESCROW_APP_ID,
  type_key: ICESCROW_GIVEAWAY_TYPE_KEY,
  label: 'Item Giveaway',
  description:
    'Records that the user gave away a physical or digital item via IceScrow escrow.',
  fields: GIVEAWAY_FIELD_DEFS,
};

// ── Helper — build a record payload from structured input ────────────────────

export interface IcescrowGiveawayInput {
  escrowId: string;
  itemTitle: string;
  itemCategory?: string;
  itemCondition?: string;
  quantity?: number;
  receiverProfileId?: string;
  escrowStatus: EscrowStatus;
  proofUrl?: string;
}

/** Converts a typed giveaway input into the generic MetadataEntry[] payload. */
export function buildGiveawayPayload(input: IcescrowGiveawayInput): MetadataEntry[] {
  const entries: MetadataEntry[] = [
    { key: ICESCROW_FIELDS.ESCROW_ID, value: input.escrowId },
    { key: ICESCROW_FIELDS.ITEM_TITLE, value: input.itemTitle },
    { key: ICESCROW_FIELDS.ESCROW_STATUS, value: input.escrowStatus },
  ];
  if (input.itemCategory) {
    entries.push({ key: ICESCROW_FIELDS.ITEM_CATEGORY, value: input.itemCategory });
  }
  if (input.itemCondition) {
    entries.push({ key: ICESCROW_FIELDS.ITEM_CONDITION, value: input.itemCondition });
  }
  if (input.quantity !== undefined) {
    entries.push({ key: ICESCROW_FIELDS.QUANTITY, value: String(input.quantity) });
  }
  if (input.receiverProfileId) {
    entries.push({ key: ICESCROW_FIELDS.RECEIVER_PROFILE_ID, value: input.receiverProfileId });
  }
  if (input.proofUrl) {
    entries.push({ key: ICESCROW_FIELDS.PROOF_URL, value: input.proofUrl });
  }
  return entries;
}

/**
 * Builds a complete NewActivityRecord for a giveaway event.
 *
 * @param profileId   OneBlock profile ID of the giver.
 * @param input       Structured giveaway details.
 * @param eventTimeMs Unix timestamp (ms) when the escrow was finalized.
 * @param visibility  Desired visibility for the record (defaults to #global).
 */
export function buildGiveawayRecord(
  profileId: string,
  input: IcescrowGiveawayInput,
  eventTimeMs: number,
  visibility: Visibility = { global: null },
): NewActivityRecord {
  return {
    profile_id: profileId,
    app_id: ICESCROW_APP_ID,
    activity_type: ICESCROW_GIVEAWAY_TYPE_KEY,
    amount: [],          // item giveaways have no monetary amount
    currency: [],
    event_timestamp: BigInt(eventTimeMs),
    payload: buildGiveawayPayload(input),
    schema_version: 1n,
    idempotency_key: `${ICESCROW_APP_ID}:${input.escrowId}`,
    attestation: [],
    visibility,
  };
}
