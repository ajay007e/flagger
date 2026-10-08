export interface AvailableItem {
  id: number;
  key: string;
  name: string;
  description?: string | null;
}

export interface AvailableAccess {
  projects: AvailableItem[];
  environments: AvailableItem[];
}
