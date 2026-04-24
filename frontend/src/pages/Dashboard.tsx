import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { SummaryCard } from "../components/SummaryCard";
import { InventoryChart } from "../components/InventoryChart";
import { AlertPanel } from "../components/AlertPanel";
import { ActivityTable } from "../components/ActivityTable";
import { Text } from "../components/Text";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { api, ensureToken, exportEntity, fetchDashboardSummary } from "../services/api";
import { PageLayout } from "../components/PageLayout";

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 12px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const StatusCard = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 20px;
`;

const LoginGrid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

// Tela principal inspirada na referencia visual e adaptada ao Caso 12.
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<
    Array<{ title: string; value: string; delta: string; positive: boolean }>
  >([]);
  const [movementSeries, setMovementSeries] = useState<number[]>([]);
  const [lowStockItems, setLowStockItems] = useState<
    Array<{ code: string; title: string; qty: number; min: number }>
  >([]);
  const [activityRows, setActivityRows] = useState<
    Array<{ date: string; type: string; item: string; qty: number }>
  >([]);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("admin@biblioteca.com");
  const [password, setPassword] = useState("admin123");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<"all" | "entry" | "exit">("all");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const authToken = token || (await ensureToken());
        if (!token) {
          setToken(authToken);
        }
        const data = await fetchDashboardSummary(authToken);

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

        const recentQuantities = data.recentMovements.slice(0, 12).map((m) => m.quantity);
        const maxQuantity = Math.max(...recentQuantities, 1);
        setMovementSeries(recentQuantities.map((qty) => Math.max(18, (qty / maxQuantity) * 100)));
      } catch {
        setError(
          "Nao foi possivel autenticar automaticamente. Entre com um usuario valido para carregar os dados."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [token]);

  async function handleManualLogin() {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/auth/login", { email, password });
      setToken(response.data.data.token as string);
    } catch {
      setError("Login invalido. Confira email/senha e se o usuario existe no banco.");
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!token) return;
    const format = window.prompt("Formato de exportacao: pdf ou xlsx", "pdf");
    if (format !== "pdf" && format !== "xlsx") return;
    await exportEntity(token, "movements", format);
  }

  const stableSeries = useMemo(() => {
    if (movementSeries.length === 0) {
      return [28, 36, 40, 52, 48, 61, 55, 67, 58, 46, 62, 70];
    }
    return movementSeries;
  }, [movementSeries]);

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

  const chartValues = useMemo(() => {
    if (period === "all") return stableSeries;
    const factor = period === "entry" ? 1 : 0.75;
    return stableSeries.map((value) => value * factor);
  }, [period, stableSeries]);

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
            <LoginGrid>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Senha"
              />
              <Button onClick={handleManualLogin}>Entrar</Button>
            </LoginGrid>
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
