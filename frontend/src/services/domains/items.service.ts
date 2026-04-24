import { createItem, exportEntity, fetchItems } from "../api";

export const itemsService = {
  list: fetchItems,
  create: createItem,
  export: (token: string, format: "pdf" | "xlsx", search?: string) =>
    exportEntity(token, "items", format, { search: search || "" })
};
