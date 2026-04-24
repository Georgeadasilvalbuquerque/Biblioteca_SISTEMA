import { useEffect, useRef, useState } from "react";
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
import { Button } from "../components/Button";
import { Input } from "../components/Input";

const PageHeader = styled.div`
  display: grid;
  gap: 6px;
`;

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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 31, 74, 0.35);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 16px;
`;

const Modal = styled.div`
  width: min(480px, 100%);
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
`;

const Select = styled.select`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surface};
  padding: 10px 12px;
  color: ${({ theme }) => theme.colors.text};
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.15);
  }
`;

const FormatChoice = styled.div`
  display: flex;
  gap: 8px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

type ReportEntity = "items" | "movements" | "loans" | "members";
type ExportFormat = "pdf" | "xlsx";

export default function Relatorios() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [cards, setCards] = useState([
    { title: "Itens", value: "0", delta: "Catalogados", positive: true },
    { title: "Movimentacoes", value: "0", delta: "Historico", positive: true },
    { title: "Emprestimos", value: "0", delta: "Fluxo", positive: true },
    { title: "Membros", value: "0", delta: "Cadastrados", positive: true }
  ]);
  const [activityRows, setActivityRows] = useState<
    Array<{ date: string; type: string; item: string; qty: number }>
  >([]);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [modalEntity, setModalEntity] = useState<ReportEntity>("items");
  const [modalFormat, setModalFormat] = useState<ExportFormat>("pdf");
  const [modalExporting, setModalExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const bootstrappedRef = useRef(false);

  async function handleModalExport() {
    setModalExporting(true);
    setExportError(null);
    try {
      if (modalEntity === "items") await itemsService.export(token, modalFormat, search);
      if (modalEntity === "movements") await movementsService.export(token, modalFormat);
      if (modalEntity === "loans") await loansService.export(token, modalFormat);
      if (modalEntity === "members") await membersService.export(token, modalFormat, search);
      setExportModalOpen(false);
    } catch {
      setExportError("Nao foi possivel gerar o arquivo. Tente novamente.");
    } finally {
      setModalExporting(false);
    }
  }

  function openExportModal() {
    setExportError(null);
    setExportModalOpen(true);
  }

  useEffect(() => {
    async function boot() {
      if (bootstrappedRef.current) return;
      bootstrappedRef.current = true;
      setPageLoading(true);
      setPageError(null);
      try {
        const authToken = await ensureToken();
        setToken(authToken);
        const [dashboard, items, movements, loans, members] = await Promise.all([
          fetchDashboardSummary(authToken),
          itemsService.list(authToken, search),
          movementsService.list(authToken),
          loansService.list(authToken),
          membersService.list(authToken, search)
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
      } catch {
        setPageError("Nao foi possivel carregar os dados dos relatorios.");
      } finally {
        setPageLoading(false);
      }
    }
    void boot();
  }, []);

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={openExportModal}
      onPrimaryClick={openExportModal}
      primaryLabel="Exportar relatorio"
      placeholder="Filtro de busca (itens e membros no export)..."
    >
      <PageHeader>
        <Text variant="title" color="#0f1f4a">
          Central de relatorios
        </Text>
        <Text variant="caption" color="#6f7c9b">
          Gere arquivos em PDF ou Excel (XLSX) por modulo. O campo de busca do topo filtra exportacoes
          de itens e membros.
        </Text>
      </PageHeader>

      {pageLoading && (
        <Text variant="body" color="#6f7c9b">
          Carregando resumo...
        </Text>
      )}
      {pageError && !pageLoading && (
        <Text variant="body" color="#ef5b67">
          {pageError}
        </Text>
      )}

      <SummaryGrid>
        {cards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </SummaryGrid>

      <TableCard>
        <Text variant="subtitle">Visao geral — ultimas movimentacoes</Text>
        <Text variant="caption" color="#6f7c9b">
          Amostra usada no painel; o export de movimentacoes inclui o historico completo.
        </Text>
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
            {activityRows.length === 0 && !pageLoading ? (
              <tr>
                <td colSpan={4}>
                  {pageError ? "—" : "Nenhum movimento recente."}
                </td>
              </tr>
            ) : (
              activityRows.map((row, index) => (
                <tr key={`${row.item}-${index}`}>
                  <td>{row.date}</td>
                  <td>{row.type}</td>
                  <td>{row.item}</td>
                  <td>{row.qty}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableCard>

      {exportModalOpen && (
        <Overlay onClick={() => !modalExporting && setExportModalOpen(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <Text variant="subtitle">Exportar relatorio</Text>
            <Text variant="caption" color="#6f7c9b">
              Escolha o modulo e o formato do arquivo. Itens e membros usam o filtro de busca do topo.
            </Text>

            <Field>
              <Text variant="caption">Modulo</Text>
              <Select value={modalEntity} onChange={(e) => setModalEntity(e.target.value as ReportEntity)}>
                <option value="items">Itens</option>
                <option value="movements">Movimentacoes</option>
                <option value="loans">Emprestimos</option>
                <option value="members">Membros</option>
              </Select>
            </Field>

            <Field>
              <Text variant="caption">Formato</Text>
              <FormatChoice>
                <Button
                  type="button"
                  variant={modalFormat === "pdf" ? "primary" : "ghost"}
                  onClick={() => setModalFormat("pdf")}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <i className="bi bi-filetype-pdf" />
                    PDF
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={modalFormat === "xlsx" ? "primary" : "ghost"}
                  onClick={() => setModalFormat("xlsx")}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <i className="bi bi-filetype-xlsx" />
                    Excel (XLSX)
                  </span>
                </Button>
              </FormatChoice>
            </Field>

            {(modalEntity === "items" || modalEntity === "members") && (
              <Field>
                <Text variant="caption">Filtro (opcional)</Text>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Texto do campo de busca do topo"
                />
              </Field>
            )}

            {exportError && (
              <Text variant="caption" color="#ef5b67">
                {exportError}
              </Text>
            )}

            <ModalActions>
              <Button type="button" variant="ghost" onClick={() => setExportModalOpen(false)} disabled={modalExporting}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleModalExport()} disabled={modalExporting || !token}>
                {modalExporting ? "Gerando..." : "Baixar arquivo"}
              </Button>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </PageLayout>
  );
}
