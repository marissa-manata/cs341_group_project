/*
models.ts
TypeScript helper types for certain models
*/

export type User = {
  active: boolean;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  admin: boolean;
  donator: boolean;
  volunteer: boolean;
  balance: number;
  password: string;
};
