import { useEffect, useState } from "react";
import styled from "styled-components";
import { PageLayout } from "../components/PageLayout";
import { SummaryCard } from "../components/SummaryCard";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken, fetchDashboardSummary } from "../services/api";
import { itemsService } from "../services/domains/items.service";
import { movementsService } from "../services/domains/movements.service";
import { loansService } from "../services/domains/loans.service";
import { membersService } from "../services/domains/members.service";

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
`;

export default function Relatorios() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState([
    { title: "Itens", value: "0", delta: "Registros", positive: true },
    { title: "Movimentacoes", value: "0", delta: "Registros", positive: true },
    { title: "Emprestimos", value: "0", delta: "Registros", positive: true },
    { title: "Membros", value: "0", delta: "Registros", positive: true }
  ]);
  const [activityRows, setActivityRows] = useState<Array<{ date: string; type: string; item: string; qty: number }>>([]);

  useEffect(() => {
    async function boot() {
      const authToken = await ensureToken();
      setToken(authToken);
      const [dashboard, items, movements, loans, members] = await Promise.all([
        fetchDashboardSummary(authToken),
        itemsService.list(authToken),
        movementsService.list(authToken),
        loansService.list(authToken),
        membersService.list(authToken)
      ]);
      setCards([
        { title: "Itens", value: String(items.length), delta: "Catalogados", positive: true },
        { title: "Movimentacoes", value: String(movements.length), delta: "Historico", positive: true },
        { title: "Emprestimos", value: String(loans.length), delta: "Fluxo", positive: true },
        { title: "Membros", value: String(members.length), delta: "Cadastrados", positive: true }
      ]);
      setActivityRows(
        dashboard.recentMovements.map((movement) => ({
          date: new Date(movement.createdAt).toLocaleString("pt-BR"),
          type: movement.type,
          item: movement.item?.title || "-",
          qty: movement.quantity
        }))
      );
    }
    boot();
  }, []);

  async function handleExport() {
    if (!token) return;
    const target = window.prompt("Qual relatorio exportar? (items, movements, loans, members)", "items");
    if (!target || !["items", "movements", "loans", "members"].includes(target)) return;
    const format = window.prompt("Formato de exportacao: pdf ou xlsx", "pdf");
    if (format !== "pdf" && format !== "xlsx") return;
    if (target === "items") await itemsService.export(token, format, search);
    if (target === "movements") await movementsService.export(token, format);
    if (target === "loans") await loansService.export(token, format);
    if (target === "members") await membersService.export(token, format, search);
  }

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleExport}
      primaryLabel="Gerar relatorio"
      placeholder="Pesquisar para filtro de relatorio..."
    >
      <SummaryGrid>
        {cards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </SummaryGrid>
      <TableCard>
        <Text variant="subtitle">Ultimas atividades para relatorio</Text>
        <Table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Item</th>
              <th>Qtd</th>
            </tr>
          </thead>
          <tbody>
            {activityRows.map((row, index) => (
              <tr key={`${row.item}-${index}`}>
                <td>{row.date}</td>
                <td>{row.type}</td>
                <td>{row.item}</td>
                <td>{row.qty}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </PageLayout>
  );
}
