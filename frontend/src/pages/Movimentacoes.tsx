import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken } from "../services/api";
import { itemsService } from "../services/domains/items.service";
import { movementsService } from "../services/domains/movements.service";

export default function Movimentacoes() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<
    Array<{ id: string; createdAt: string; type: string; quantity: number; item?: { id: string; code: string; title: string } }>
  >([]);
  const [items, setItems] = useState<Array<{ id: string; code: string; title: string }>>([]);

  async function loadData(authToken?: string) {
    const currentToken = authToken || token;
    if (!currentToken) return;
    const [movements, allItems] = await Promise.all([
      movementsService.list(currentToken),
      itemsService.list(currentToken)
    ]);
    setRows(movements);
    setItems(allItems);
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
    await movementsService.export(token, format);
  }

  async function handleCreate() {
    if (!token || items.length === 0) return;
    const itemCode = window.prompt("Codigo do item para movimentar:");
    if (!itemCode) return;
    const selected = items.find((item) => item.code.toLowerCase() === itemCode.toLowerCase());
    if (!selected) return;
    const type = window.prompt("Tipo (ENTRY, EXIT, ADJUSTMENT, LOSS):", "ENTRY");
    if (!type || !["ENTRY", "EXIT", "ADJUSTMENT", "LOSS"].includes(type)) return;
    const safeType = type as "ENTRY" | "EXIT" | "ADJUSTMENT" | "LOSS";
    const qty = Number(window.prompt("Quantidade:", "1"));
    if (!qty) return;
    await movementsService.create(token, { itemId: selected.id, type: safeType, quantity: qty });
    await loadData();
  }

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.item?.title || ""} ${row.item?.code || ""}`.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleCreate}
      primaryLabel="Nova movimentacao"
      placeholder="Pesquisar por item ou codigo..."
    >
      <TableCard>
        <Text variant="subtitle">Movimentacoes</Text>
        <Table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Item</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.createdAt).toLocaleString("pt-BR")}</td>
                <td>{row.type}</td>
                <td>{row.item?.title || "-"}</td>
                <td>{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </PageLayout>
  );
}
