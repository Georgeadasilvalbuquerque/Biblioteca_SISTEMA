import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken } from "../services/api";
import { itemsService } from "../services/domains/items.service";
import { movementsService } from "../services/domains/movements.service";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

type MovementType = "ENTRY" | "EXIT" | "ADJUSTMENT" | "LOSS";

export default function Movimentacoes() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<
    Array<{ id: string; createdAt: string; type: string; quantity: number; item?: { id: string; code: string; title: string } }>
  >([]);
  const [items, setItems] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<{
    itemId: string;
    type: MovementType;
    quantity: number;
    reason: string;
  }>({
    itemId: "",
    type: "ENTRY",
    quantity: 1,
    reason: ""
  });

  async function loadData(authToken?: string) {
    const currentToken = authToken || token;
    if (!currentToken) return;
    setLoading(true);
    setError(null);
    try {
      const [movements, allItems] = await Promise.all([
        movementsService.list(currentToken),
        itemsService.list(currentToken)
      ]);
      setRows(movements);
      setItems(allItems);
    } catch {
      setRows([]);
      setError("Nao foi possivel carregar as movimentacoes no momento.");
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
    await movementsService.export(token, format);
  }

  function handleOpenCreateModal() {
    if (items.length === 0) {
      setError("Cadastre um item antes de criar movimentacoes.");
      return;
    }
    setCreateError(null);
    setCreateForm({
      itemId: items[0]?.id || "",
      type: "ENTRY",
      quantity: 1,
      reason: ""
    });
    setIsCreateOpen(true);
  }

  function handleCloseCreateModal() {
    if (creating) return;
    setIsCreateOpen(false);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!createForm.itemId) {
      setCreateError("Selecione um item para movimentar.");
      return;
    }
    if (!createForm.quantity || Number(createForm.quantity) <= 0) {
      setCreateError("Informe uma quantidade valida.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await movementsService.create(token, {
        itemId: createForm.itemId,
        type: createForm.type,
        quantity: Number(createForm.quantity),
        reason: createForm.reason.trim() || undefined
      });
      setIsCreateOpen(false);
      await loadData();
    } catch {
      setCreateError("Nao foi possivel registrar a movimentacao.");
    } finally {
      setCreating(false);
    }
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
      onPrimaryClick={handleOpenCreateModal}
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
            {loading && (
              <tr>
                <td colSpan={4}>Carregando...</td>
              </tr>
            )}
            {!loading &&
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString("pt-BR")}</td>
                  <td>{row.type}</td>
                  <td>{row.item?.title || "-"}</td>
                  <td>{row.quantity}</td>
                </tr>
              ))}
            {!loading && error && (
              <tr>
                <td colSpan={4}>{error}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>

      {isCreateOpen && (
        <Overlay onClick={handleCloseCreateModal}>
          <Modal onClick={(event) => event.stopPropagation()}>
            <Text variant="subtitle">Nova movimentacao</Text>
            <Text variant="caption" color="#6f7c9b">
              Registre entrada, saida, ajuste ou perda de estoque.
            </Text>

            <FormGrid onSubmit={handleCreate}>
              <Field>
                <Text variant="caption">Item</Text>
                <Select
                  value={createForm.itemId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, itemId: event.target.value }))}
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.title}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Text variant="caption">Tipo</Text>
                <Select
                  value={createForm.type}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, type: event.target.value as MovementType }))
                  }
                >
                  <option value="ENTRY">Entrada</option>
                  <option value="EXIT">Saida</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                  <option value="LOSS">Perda</option>
                </Select>
              </Field>

              <Field>
                <Text variant="caption">Quantidade</Text>
                <Input
                  type="number"
                  min={1}
                  value={createForm.quantity}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      quantity: Number(event.target.value || 1)
                    }))
                  }
                />
              </Field>

              <Field>
                <Text variant="caption">Motivo (opcional)</Text>
                <Input
                  value={createForm.reason}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Ex.: Inventario mensal"
                />
              </Field>

              {createError && (
                <Text variant="caption" color="#ef5b67">
                  {createError}
                </Text>
              )}

              <Actions>
                <Button type="button" variant="ghost" onClick={handleCloseCreateModal}>
                  Cancelar
                </Button>
                <Button type="submit">{creating ? "Salvando..." : "Salvar movimentacao"}</Button>
              </Actions>
            </FormGrid>
          </Modal>
        </Overlay>
      )}
    </PageLayout>
  );
}
