// Demo accounts used by the local login flow.
export type StudentAccount = {
  id: string;
  name: string;
  password: string;
  email: string;
};

export type LecturerAccount = {
  id: string;
  name: string;
  password: string;
};

export const studentAccounts: StudentAccount[] = [
  {
    id: "s001",
    name: "Alice Wang",
    password: "student123",
    email: "alice@example.com",
  },
  {
    id: "s002",
    name: "Bob Chen",
    password: "student123",
    email: "bob@example.com",
  },
  {
    id: "s003",
    name: "Cathy Liu",
    password: "student123",
    email: "cathy@example.com",
  },
];

export const lecturerAccounts: LecturerAccount[] = [
  {
    id: "lecturer01",
    name: "Prof. Li",
    password: "teach123",
  },
];
