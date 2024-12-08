export type StatValue = string | number;

export interface StatData {
  [key: string]: StatValue;
}

export interface StatsCollection {
  [source: string]: {
    description: string;
    data: StatData;
  };
}
