import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken } from "../services/api";
import { membersService } from "../services/domains/members.service";

export default function Membros() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Array<{ id: string; name: string; email?: string | null; phone?: string | null; isActive: boolean }>>([]);

  async function loadData(authToken?: string) {
    const currentToken = authToken || token;
    if (!currentToken) return;
    const data = await membersService.list(currentToken, search);
    setMembers(data);
  }

  useEffect(() => {
    async function boot() {
      const authToken = await ensureToken();
      setToken(authToken);
      await loadData(authToken);
    }
    boot();
  }, []);

  async function handleExport() {
    if (!token) return;
    const format = window.prompt("Formato de exportacao: pdf ou xlsx", "pdf");
    if (format !== "pdf" && format !== "xlsx") return;
    await membersService.export(token, format, search);
  }

  async function handleCreate() {
    if (!token) return;
    const name = window.prompt("Nome do membro:");
    if (!name) return;
    const email = window.prompt("Email do membro (opcional):") || undefined;
    const phone = window.prompt("Telefone (opcional):") || undefined;
    await membersService.create(token, { name, email, phone });
    await loadData();
  }

  const filtered = useMemo(
    () => members.filter((member) => member.name.toLowerCase().includes(search.toLowerCase())),
    [members, search]
  );

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleCreate}
      primaryLabel="Novo membro"
      placeholder="Pesquisar membro por nome/email..."
    >
      <TableCard>
        <Text variant="subtitle">Membros</Text>
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.email || "-"}</td>
                <td>{member.phone || "-"}</td>
                <td>{member.isActive ? "Ativo" : "Inativo"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </PageLayout>
  );
}
