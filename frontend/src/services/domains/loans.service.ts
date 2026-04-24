import { createLoan, exportEntity, fetchLoans, returnLoan } from "../api";

export const loansService = {
  list: fetchLoans,
  create: createLoan,
  return: returnLoan,
  export: (token: string, format: "pdf" | "xlsx", params?: Record<string, string>) =>
    exportEntity(token, "loans", format, params)
};
