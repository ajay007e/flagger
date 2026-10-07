export interface AvailableItem {
  id: number;
  key: string;
  name: string;
}

export interface AvailableAccess {
  projects: AvailableItem[];
  environments: AvailableItem[];
}
