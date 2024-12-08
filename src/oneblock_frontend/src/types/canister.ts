import { Principal } from '@dfinity/principal';

export interface Canister {
  id: Principal;
  name: string;
  description?: string;
  created: bigint;
  owner: Principal;
}
