export type LoanDisplayStatus = "OPEN" | "LATE" | "RETURNED" | "CANCELLED";

/** Status usado em listas e contadores, alinhado a emprestimo em dia vs atraso. */
export function getLoanDisplayStatus(loan: { status: string; dueDate: string }): LoanDisplayStatus {
  if (loan.status === "RETURNED" || loan.status === "CANCELLED") {
    return loan.status as "RETURNED" | "CANCELLED";
  }
  if (loan.status === "LATE") {
    return "LATE";
  }
  if (new Date(loan.dueDate).getTime() < Date.now()) {
    return "LATE";
  }
  return "OPEN";
}

export function countLoansRentedOnTime(loans: Array<{ status: string; dueDate: string }>) {
  return loans.filter((l) => getLoanDisplayStatus(l) === "OPEN").length;
}

export function countLoansOverdue(loans: Array<{ status: string; dueDate: string }>) {
  return loans.filter((l) => getLoanDisplayStatus(l) === "LATE").length;
}
