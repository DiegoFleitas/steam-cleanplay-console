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
  // Shared button-run coordination across independent frontend bundles.
  // Prevents multiple rapid clicks from starting overlapping fetch batches.
  activeButtonClickTimeStamp: number | null;
  pendingButtonTasks: number;
}

const state: State = {
  vacLookup: {},
  graphLookup: {},
  isTF2: false,
  isCSGO: false,
  tableData: [],
  activeButtonClickTimeStamp: null,
  pendingButtonTasks: 0,
};

export default state;
