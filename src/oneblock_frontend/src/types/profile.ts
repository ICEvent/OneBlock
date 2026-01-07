import { Principal } from "@dfinity/principal";
import { BlockId, TraitId, Visibility } from "./block";

type Link = {
    name: string;
    url: string;
};

export interface Profile {
    bio: string;
    createtime: number;
    id: string;
    owner: Principal | null;
    links: Link[];
    name: string;
    pfp: string | null;
    
    // Block-chain system
    blocks?: BlockId[];
    traits?: TraitId[];
    
    // Extended fields
    visibility?: Visibility;
    last_updated?: number;
}