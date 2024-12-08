import { Principal } from "@dfinity/principal";
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
    pfp: string;
}