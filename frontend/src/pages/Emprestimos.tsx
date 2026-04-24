import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken } from "../services/api";
import { itemsService } from "../services/domains/items.service";
import { membersService } from "../services/domains/members.service";
import { loansService } from "../services/domains/loans.service";

export default function Emprestimos() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [loans, setLoans] = useState<
    Array<{
      id: string;
      status: string;
      quantity: number;
      dueDate: string;
      loanDate: string;
      item?: { id: string; code: string; title: string };
      member?: { id: string; name: string };
    }>
  >([]);
  const [items, setItems] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  async function loadData(authToken?: string) {
    const currentToken = authToken || token;
    if (!currentToken) return;
    const [loanData, itemsData, membersData] = await Promise.all([
      loansService.list(currentToken),
      itemsService.list(currentToken),
      membersService.list(currentToken)
    ]);
    setLoans(loanData);
    setItems(itemsData);
    setMembers(membersData);
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
    await loansService.export(token, format);
  }

  async function handleCreate() {
    if (!token || items.length === 0 || members.length === 0) return;
    const itemCode = window.prompt("Codigo do item:");
    const memberName = window.prompt("Nome do membro:");
    if (!itemCode || !memberName) return;
    const item = items.find((value) => value.code.toLowerCase() === itemCode.toLowerCase());
    const member = members.find((value) => value.name.toLowerCase() === memberName.toLowerCase());
    if (!item || !member) return;
    const dueDays = Number(window.prompt("Prazo em dias:", "7")) || 7;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);
    await loansService.create(token, { itemId: item.id, memberId: member.id, dueDate: dueDate.toISOString() });
    await loadData();
  }

  async function handleReturn(loanId: string) {
    if (!token) return;
    await loansService.return(token, loanId);
    await loadData();
  }

  const filtered = useMemo(
    () =>
      loans.filter((loan) =>
        `${loan.item?.title || ""} ${loan.member?.name || ""}`.toLowerCase().includes(search.toLowerCase())
      ),
    [loans, search]
  );

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleCreate}
      primaryLabel="Novo emprestimo"
      placeholder="Pesquisar por item ou membro..."
    >
      <TableCard>
        <Text variant="subtitle">Emprestimos</Text>
        <Table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Membro</th>
              <th>Status</th>
              <th>Prazo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.item?.title || "-"}</td>
                <td>{loan.member?.name || "-"}</td>
                <td>{loan.status}</td>
                <td>{new Date(loan.dueDate).toLocaleDateString("pt-BR")}</td>
                <td>
                  {loan.status === "OPEN" || loan.status === "LATE" ? (
                    <button type="button" onClick={() => handleReturn(loan.id)}>
                      Devolver
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </PageLayout>
  );
}
