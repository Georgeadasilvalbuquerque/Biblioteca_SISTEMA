import { createMember, exportEntity, fetchMembers } from "../api";

export const membersService = {
  list: fetchMembers,
  create: createMember,
  export: (token: string, format: "pdf" | "xlsx", search?: string) =>
    exportEntity(token, "members", format, { search: search || "" })
};
