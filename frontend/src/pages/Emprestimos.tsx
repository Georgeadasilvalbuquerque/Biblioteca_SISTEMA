import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken } from "../services/api";
import { itemsService } from "../services/domains/items.service";
import { membersService } from "../services/domains/members.service";
import { loansService } from "../services/domains/loans.service";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { countLoansOverdue, countLoansRentedOnTime, getLoanDisplayStatus } from "../utils/loanUi";

const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 14px;
  display: grid;
  gap: 4px;
`;

const StatusFilter = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ $tone: "open" | "late" | "other" }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  color: ${({ $tone, theme }) =>
    $tone === "open" ? theme.colors.primary : $tone === "late" ? theme.colors.danger : theme.colors.textMuted};
  background: ${({ $tone, theme }) =>
    $tone === "open" ? theme.colors.primarySoft : $tone === "late" ? "#ffe7ea" : "#eef1f7"};
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
  width: min(560px, 100%);
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const FormGrid = styled.form`
  display: grid;
  gap: 12px;
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

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

type StatusFilterKey = "all" | "open" | "late";

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

type LoanSituation = "on_time" | "overdue";

export default function Emprestimos() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [creatingLoan, setCreatingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);
  const [loanForm, setLoanForm] = useState({
    itemId: "",
    memberId: "",
    quantity: 1,
    situation: "on_time" as LoanSituation,
    dueDate: toDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    notes: ""
  });

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  async function loadData(authToken?: string) {
    const currentToken = authToken || token;
    if (!currentToken) return;
    setLoading(true);
    setError(null);
    try {
      const [loanData, itemsData, membersData] = await Promise.all([
        loansService.list(currentToken),
        itemsService.list(currentToken),
        membersService.list(currentToken)
      ]);
      setLoans(loanData);
      setItems(itemsData);
      setMembers(membersData);
    } catch {
      setLoans([]);
      setError("Nao foi possivel carregar os emprestimos no momento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function boot() {
      if (bootstrappedRef.current) return;
      bootstrappedRef.current = true;
      try {
        const authToken = await ensureToken();
        setToken(authToken);
        await loadData(authToken);
      } catch {
        setLoading(false);
        setError("Falha ao autenticar automaticamente.");
      }
    }
    void boot();
  }, []);

  async function handleExport() {
    if (!token) return;
    const format = window.prompt("Formato de exportacao: pdf ou xlsx", "pdf");
    if (format !== "pdf" && format !== "xlsx") return;
    await loansService.export(token, format);
  }

  function handleOpenLoanModal() {
    if (items.length === 0) {
      setError("Cadastre itens antes de criar emprestimos.");
      return;
    }
    if (members.length === 0) {
      setError("Cadastre membros antes de criar emprestimos.");
      return;
    }
    setLoanError(null);
    setLoanForm({
      itemId: items[0]?.id || "",
      memberId: members[0]?.id || "",
      quantity: 1,
      situation: "on_time",
      dueDate: toDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      notes: ""
    });
    setIsLoanModalOpen(true);
  }

  function handleCloseLoanModal() {
    if (creatingLoan) return;
    setIsLoanModalOpen(false);
  }

  async function handleCreateLoan(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!loanForm.itemId || !loanForm.memberId) {
      setLoanError("Selecione item e membro.");
      return;
    }
    if (!loanForm.quantity || Number(loanForm.quantity) <= 0) {
      setLoanError("Quantidade invalida.");
      return;
    }
    if (!loanForm.dueDate) {
      setLoanError("Informe o prazo de devolucao.");
      return;
    }

    setCreatingLoan(true);
    setLoanError(null);
    try {
      await loansService.create(token, {
        itemId: loanForm.itemId,
        memberId: loanForm.memberId,
        quantity: Number(loanForm.quantity),
        dueDate: new Date(`${loanForm.dueDate}T00:00:00`).toISOString(),
        notes: loanForm.notes.trim() || undefined
      });
      setIsLoanModalOpen(false);
      await loadData();
    } catch {
      setLoanError("Nao foi possivel criar o emprestimo.");
    } finally {
      setCreatingLoan(false);
    }
  }

  function handleOpenMemberModal() {
    setMemberError(null);
    setMemberForm({ name: "", email: "", phone: "" });
    setIsMemberModalOpen(true);
  }

  function handleCloseMemberModal() {
    if (creatingMember) return;
    setIsMemberModalOpen(false);
  }

  async function handleCreateMember(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!memberForm.name.trim()) {
      setMemberError("Informe o nome do membro.");
      return;
    }

    setCreatingMember(true);
    setMemberError(null);
    try {
      const created = await membersService.create(token, {
        name: memberForm.name.trim(),
        email: memberForm.email.trim() || undefined,
        phone: memberForm.phone.trim() || undefined
      });
      setMembers((prev) => [...prev, { id: created.id, name: created.name }]);
      setLoanForm((prev) => ({ ...prev, memberId: created.id }));
      setIsMemberModalOpen(false);
    } catch {
      setMemberError("Nao foi possivel cadastrar o membro.");
    } finally {
      setCreatingMember(false);
    }
  }

  async function handleReturn(loanId: string) {
    if (!token) return;
    await loansService.return(token, loanId);
    await loadData();
  }

  const normalizedLoans = useMemo(
    () =>
      loans.map((loan) => ({
        ...loan,
        uiStatus: getLoanDisplayStatus(loan)
      })),
    [loans]
  );

  const filtered = useMemo(
    () =>
      normalizedLoans.filter((loan) => {
        const bySearch = `${loan.item?.title || ""} ${loan.member?.name || ""} ${loan.item?.code || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        if (!bySearch) return false;
        if (statusFilter === "open") return loan.uiStatus === "OPEN";
        if (statusFilter === "late") return loan.uiStatus === "LATE";
        return true;
      }),
    [normalizedLoans, search, statusFilter]
  );

  const rentedCount = useMemo(() => countLoansRentedOnTime(loans), [loans]);
  const lateCount = useMemo(() => countLoansOverdue(loans), [loans]);

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleOpenLoanModal}
      primaryLabel="Novo emprestimo"
      placeholder="Pesquisar por item ou membro..."
    >
      <Metrics>
        <MetricCard>
          <Text variant="caption" color="#6f7c9b">
            Livros alugados
          </Text>
          <Text variant="title" color="#4f7cff">
            {rentedCount}
          </Text>
        </MetricCard>
        <MetricCard>
          <Text variant="caption" color="#6f7c9b">
            Livros em atrasos
          </Text>
          <Text variant="title" color="#ef5b67">
            {lateCount}
          </Text>
        </MetricCard>
      </Metrics>

      <TableCard>
        <Text variant="subtitle">Emprestimos</Text>
        <StatusFilter>
          <Button
            variant={statusFilter === "all" ? "primary" : "ghost"}
            onClick={() => setStatusFilter("all")}
            type="button"
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "open" ? "primary" : "ghost"}
            onClick={() => setStatusFilter("open")}
            type="button"
          >
            Alugados
          </Button>
          <Button
            variant={statusFilter === "late" ? "primary" : "ghost"}
            onClick={() => setStatusFilter("late")}
            type="button"
          >
            Atrasados
          </Button>
        </StatusFilter>
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
            {loading && (
              <tr>
                <td colSpan={5}>Carregando...</td>
              </tr>
            )}
            {!loading &&
              filtered.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.item?.title || "-"}</td>
                  <td>{loan.member?.name || "-"}</td>
                  <td>
                    {loan.uiStatus === "OPEN" && <Badge $tone="open">Alugado</Badge>}
                    {loan.uiStatus === "LATE" && <Badge $tone="late">Atrasado</Badge>}
                    {loan.uiStatus !== "OPEN" && loan.uiStatus !== "LATE" && (
                      <Badge $tone="other">{String(loan.uiStatus)}</Badge>
                    )}
                  </td>
                  <td>{new Date(loan.dueDate).toLocaleDateString("pt-BR")}</td>
                  <td>
                    {loan.uiStatus === "OPEN" || loan.uiStatus === "LATE" ? (
                      <Button type="button" onClick={() => handleReturn(loan.id)}>
                        Devolver
                      </Button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            {!loading && error && (
              <tr>
                <td colSpan={5}>{error}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>

      {isLoanModalOpen && (
        <Overlay onClick={handleCloseLoanModal}>
          <Modal onClick={(event) => event.stopPropagation()}>
            <Text variant="subtitle">Novo emprestimo</Text>
            <Text variant="caption" color="#6f7c9b">
              Selecione item, membro e prazo para registrar o aluguel.
            </Text>

            <FormGrid onSubmit={handleCreateLoan}>
              <Field>
                <Text variant="caption">Item</Text>
                <Select
                  value={loanForm.itemId}
                  onChange={(event) => setLoanForm((prev) => ({ ...prev, itemId: event.target.value }))}
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.title}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Text variant="caption">Membro</Text>
                <Row>
                  <Select
                    value={loanForm.memberId}
                    onChange={(event) => setLoanForm((prev) => ({ ...prev, memberId: event.target.value }))}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="ghost" onClick={handleOpenMemberModal}>
                    Novo membro
                  </Button>
                </Row>
              </Field>

              <Field>
                <Text variant="caption">Situacao do emprestimo</Text>
                <Select
                  value={loanForm.situation}
                  onChange={(event) => {
                    const value = event.target.value as LoanSituation;
                    if (value === "overdue") {
                      setLoanForm((prev) => ({
                        ...prev,
                        situation: "overdue",
                        dueDate: toDateInputValue(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
                      }));
                    } else {
                      setLoanForm((prev) => ({
                        ...prev,
                        situation: "on_time",
                        dueDate: toDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
                      }));
                    }
                  }}
                >
                  <option value="on_time">Alugado (no prazo)</option>
                  <option value="overdue">Atrasado (vencido)</option>
                </Select>
                <Text variant="caption" color="#6f7c9b">
                  Atraso usa prazo no passado; alugado em dia com prazo futuro. Voce pode ajustar a data abaixo.
                </Text>
              </Field>

              <Row>
                <Field>
                  <Text variant="caption">Quantidade</Text>
                  <Input
                    type="number"
                    min={1}
                    value={loanForm.quantity}
                    onChange={(event) =>
                      setLoanForm((prev) => ({
                        ...prev,
                        quantity: Number(event.target.value || 1)
                      }))
                    }
                  />
                </Field>
                <Field>
                  <Text variant="caption">Prazo</Text>
                  <Input
                    type="date"
                    value={loanForm.dueDate}
                    onChange={(event) => setLoanForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                </Field>
              </Row>

              <Field>
                <Text variant="caption">Observacoes (opcional)</Text>
                <Input
                  value={loanForm.notes}
                  onChange={(event) => setLoanForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Ex.: Aluguel para estudo"
                />
              </Field>

              {loanError && (
                <Text variant="caption" color="#ef5b67">
                  {loanError}
                </Text>
              )}

              <Actions>
                <Button type="button" variant="ghost" onClick={handleCloseLoanModal}>
                  Cancelar
                </Button>
                <Button type="submit">{creatingLoan ? "Salvando..." : "Salvar emprestimo"}</Button>
              </Actions>
            </FormGrid>
          </Modal>
        </Overlay>
      )}

      {isMemberModalOpen && (
        <Overlay onClick={handleCloseMemberModal}>
          <Modal onClick={(event) => event.stopPropagation()}>
            <Text variant="subtitle">Novo membro</Text>
            <Text variant="caption" color="#6f7c9b">
              Cadastre o membro para vincular ao emprestimo.
            </Text>

            <FormGrid onSubmit={handleCreateMember}>
              <Field>
                <Text variant="caption">Nome</Text>
                <Input
                  value={memberForm.name}
                  onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Nome do membro"
                />
              </Field>
              <Field>
                <Text variant="caption">Email (opcional)</Text>
                <Input
                  type="email"
                  value={memberForm.email}
                  onChange={(event) => setMemberForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </Field>
              <Field>
                <Text variant="caption">Telefone (opcional)</Text>
                <Input
                  value={memberForm.phone}
                  onChange={(event) => setMemberForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </Field>

              {memberError && (
                <Text variant="caption" color="#ef5b67">
                  {memberError}
                </Text>
              )}

              <Actions>
                <Button type="button" variant="ghost" onClick={handleCloseMemberModal}>
                  Cancelar
                </Button>
                <Button type="submit">{creatingMember ? "Salvando..." : "Salvar membro"}</Button>
              </Actions>
            </FormGrid>
          </Modal>
        </Overlay>
      )}
    </PageLayout>
  );
}
