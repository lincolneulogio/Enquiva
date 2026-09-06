export interface TeamRow {
  member: { role: string; status?: string };
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    createdAt: Date;
  };
}
