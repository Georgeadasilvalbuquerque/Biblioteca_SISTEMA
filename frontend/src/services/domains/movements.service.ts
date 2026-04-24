import { createMovement, exportEntity, fetchMovements } from "../api";

export const movementsService = {
  list: fetchMovements,
  create: createMovement,
  export: (token: string, format: "pdf" | "xlsx", params?: Record<string, string>) =>
    exportEntity(token, "movements", format, params)
};
