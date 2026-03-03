export interface VacLookupEntry {
  name: string;
  id: string;
  [key: string]: unknown;
}

export interface State {
  vacLookup: Record<string, VacLookupEntry>;
  graphLookup: Record<string, unknown>;
  isTF2: boolean;
  isCSGO: boolean;
  tableData: unknown[];
}

const state: State = {
  vacLookup: {},
  graphLookup: {},
  isTF2: false,
  isCSGO: false,
  tableData: [],
};

export default state;
