import { Principal } from '@dfinity/principal';
export interface Post {
    id: string;
    post: string;
    timestamp: string;
}

export interface Message {
  id: string;
  sender: Principal;
  content: string;
  timestamp: bigint;
  read: boolean;
}

export interface InboxConfig {
  storageLimit: number;
  autoDelete: boolean;
  allowedSenders: Principal[];
}
