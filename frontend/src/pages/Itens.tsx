import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken, type ItemType } from "../services/api";
import { itemsService } from "../services/domains/items.service";

export default function Itens() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<
    Array<{ id: string; code: string; title: string; type: string; currentQuantity: number; minimumQuantity: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  async function loadItems(authToken?: string) {
    const currentToken = authToken || token;
    if (!currentToken) return;
    setLoading(true);
    const data = await itemsService.list(currentToken, search);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    async function boot() {
      const authToken = await ensureToken();
      setToken(authToken);
      await loadItems(authToken);
    }
    boot();
  }, []);

  const rows = useMemo(
    () => items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  async function handleExport() {
    if (!token) return;
    const format = window.prompt("Formato de exportacao: pdf ou xlsx", "pdf");
    if (format !== "pdf" && format !== "xlsx") return;
    await itemsService.export(token, format, search);
  }

  async function handleCreateItem() {
    if (!token) return;
    const code = window.prompt("Codigo do item:");
    if (!code) return;
    const title = window.prompt("Titulo do item:");
    if (!title) return;
    const type = (window.prompt("Tipo (BOOK, MAGAZINE, SUPPORT_MATERIAL):", "BOOK") || "BOOK") as ItemType;
    await itemsService.create(token, { code, title, type, minimumQuantity: 1, currentQuantity: 0 });
    await loadItems();
  }

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleCreateItem}
      primaryLabel="Novo item"
      placeholder="Pesquisar item, codigo, titulo..."
    >
      <TableCard>
        <Text variant="subtitle">Itens cadastrados</Text>
        <Table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Titulo</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Minimo</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5}>Carregando...</td>
              </tr>
            )}
            {!loading &&
              rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td>{item.currentQuantity}</td>
                  <td>{item.minimumQuantity}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </TableCard>
    </PageLayout>
  );
}