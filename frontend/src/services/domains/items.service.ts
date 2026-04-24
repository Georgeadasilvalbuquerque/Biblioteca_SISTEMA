import { createItem, deleteItem, exportEntity, fetchItems, updateItem } from "../api";

export const itemsService = {
  list: fetchItems,
  create: createItem,
  update: updateItem,
  remove: deleteItem,
  export: (token: string, format: "pdf" | "xlsx", search?: string) =>
    exportEntity(token, "items", format, { search: search || "" })
};
