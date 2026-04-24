import { useEffect, useMemo, useState } from "react";
import { SummaryCard } from "../components/SummaryCard";
import { InventoryChart } from "../components/InventoryChart";
import { AlertPanel } from "../components/AlertPanel";
import { ActivityTable } from "../components/ActivityTable";
import { Text } from "../components/Text";
import { ensureToken, exportEntity, fetchDashboardSummary, fetchLoans, getStoredToken } from "../services/api";
import { countLoansOverdue, countLoansRentedOnTime } from "../utils/loanUi";
import { PageLayout } from "../components/PageLayout";
import { MainGrid, StatusCard, SummaryGrid } from "../components/DashboardLayout";

// Tela principal inspirada na referencia visual e adaptada ao Caso 12.
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<
    Array<{ title: string; value: string; delta: string; positive: boolean }>
  >([]);
  const [lowStockItems, setLowStockItems] = useState<
    Array<{ code: string; title: string; qty: number; min: number }>
  >([]);
  const [activityRows, setActivityRows] = useState<
    Array<{ date: string; type: string; item: string; qty: number }>
  >([]);
  const [collectionStatus, setCollectionStatus] = useState({
    available: 0,
    rented: 0,
    overdue: 0
  });
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<"all" | "entry" | "exit">("all");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const authToken = await ensureToken();
        const data = await fetchDashboardSummary(authToken);
        let loansForCounts: Array<{ status: string; dueDate: string }> = [];
        try {
          loansForCounts = await fetchLoans(authToken);
        } catch {
          loansForCounts = [];
        }

        setSummaryData([
          {
            title: "Itens cadastrados",
            value: String(data.cards.totalItems),
            delta: "Dados reais",
            positive: true
          },
          {
            title: "Entradas (mes)",
            value: String(data.cards.entriesInMonth),
            delta: "Atualizado",
            positive: true
          },
          {
            title: "Saidas (mes)",
            value: String(data.cards.exitsInMonth),
            delta: "Atualizado",
            positive: false
          },
          {
            title: "Disponiveis agora",
            value: String(data.cards.availableNow),
            delta: "Estoque atual",
            positive: true
          }
        ]);

        setLowStockItems(
          data.lowStock.map((item) => ({
            code: item.code,
            title: item.title,
            qty: item.currentQuantity,
            min: item.minimumQuantity
          }))
        );

        setActivityRows(
          data.recentMovements.map((movement) => ({
            date: new Date(movement.createdAt).toLocaleString("pt-BR"),
            type: movement.type,
            item: movement.item?.title || "Item sem referencia",
            qty: movement.quantity
          }))
        );

        setCollectionStatus({
          available: data.cards.availableNow,
          rented: countLoansRentedOnTime(loansForCounts),
          overdue: countLoansOverdue(loansForCounts)
        });
      } catch {
        setError("Nao foi possivel carregar os dados. Tente novamente ou verifique a conexao com o servidor.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleExport() {
    const t = getStoredToken();
    if (!t) return;
    const format = window.prompt("Formato de exportacao: pdf ou xlsx", "pdf");
    if (format !== "pdf" && format !== "xlsx") return;
    await exportEntity(t, "movements", format);
  }

  const filteredActivities = useMemo(
    () =>
      activityRows.filter((row) => {
        const bySearch = row.item.toLowerCase().includes(search.toLowerCase());
        if (period === "entry") return bySearch && row.type === "ENTRY";
        if (period === "exit") return bySearch && ["EXIT", "LOAN", "LOSS"].includes(row.type);
        return bySearch;
      }),
    [activityRows, period, search]
  );

  const chartValues = useMemo(
    () => ({
      available: collectionStatus.available,
      rented: collectionStatus.rented,
      overdue: collectionStatus.overdue
    }),
    [collectionStatus]
  );

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={() => setPeriod(period === "all" ? "entry" : period === "entry" ? "exit" : "all")}
      primaryLabel={`Filtro: ${period === "all" ? "Todos" : period === "entry" ? "Entradas" : "Saidas"}`}
    >

        {loading && (
          <StatusCard>
            <Text variant="subtitle">Carregando dados do backend...</Text>
          </StatusCard>
        )}

        {error && (
          <StatusCard>
            <Text variant="subtitle" color="#ef5b67">
              {error}
            </Text>
          </StatusCard>
        )}

        <SummaryGrid>
          {summaryData.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </SummaryGrid>

        <MainGrid>
          <InventoryChart values={chartValues} />
          <AlertPanel
            items={lowStockItems.filter((item) =>
              item.title.toLowerCase().includes(search.toLowerCase())
            )}
          />
        </MainGrid>

        <ActivityTable rows={filteredActivities} />
    </PageLayout>
  );
}
