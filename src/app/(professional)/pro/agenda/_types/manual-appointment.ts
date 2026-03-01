export type PatientOption = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type PatientMode = "select" | "new";
