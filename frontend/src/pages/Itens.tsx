import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken, type ItemType } from "../services/api";
import { itemsService } from "../services/domains/items.service";
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

const TableActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
`;

const IconButton = styled.button<{ $variant?: "default" | "danger" }>`
  border: none;
  background: transparent;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.sm};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $variant }) => ($variant === "danger" ? theme.colors.danger : theme.colors.textMuted)};
  transition: 0.15s ease;
  &:hover {
    color: ${({ theme, $variant }) => ($variant === "danger" ? "#fff" : theme.colors.primary)};
    background: ${({ theme, $variant }) =>
      $variant === "danger" ? theme.colors.danger : theme.colors.primarySoft};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function Itens() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<
    Array<{ id: string; code: string; title: string; type: string; currentQuantity: number; minimumQuantity: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    code: "",
    title: "",
    type: "BOOK" as ItemType,
    currentQuantity: 0,
    minimumQuantity: 1
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    id: "",
    code: "",
    title: "",
    type: "BOOK" as ItemType,
    currentQuantity: 0,
    minimumQuantity: 1
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadItems(authToken?: string) {
    const currentToken = authToken || token;
    if (!currentToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await itemsService.list(currentToken, search);
      setItems(data);
    } catch {
      setItems([]);
      setError("Nao foi possivel carregar os itens no momento.");
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
        await loadItems(authToken);
      } catch {
        setLoading(false);
        setError("Falha ao autenticar automaticamente.");
      }
    }
    void boot();
  }, []);

  const rows = useMemo(
    () =>
      items.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.code.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  async function handleExport() {
    if (!token) return;
    const format = window.prompt("Formato de exportacao: pdf ou xlsx", "pdf");
    if (format !== "pdf" && format !== "xlsx") return;
    await itemsService.export(token, format, search);
  }

  function handleOpenCreateModal() {
    setCreateError(null);
    setCreateForm({
      code: "",
      title: "",
      type: "BOOK",
      currentQuantity: 0,
      minimumQuantity: 1
    });
    setIsCreateOpen(true);
  }

  function handleCloseCreateModal() {
    if (creating) return;
    setIsCreateOpen(false);
  }

  async function handleCreateItem(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!createForm.code.trim() || !createForm.title.trim()) {
      setCreateError("Preencha codigo e titulo.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await itemsService.create(token, {
        code: createForm.code.trim(),
        title: createForm.title.trim(),
        type: createForm.type,
        minimumQuantity: Number(createForm.minimumQuantity),
        currentQuantity: Number(createForm.currentQuantity)
      });
      setIsCreateOpen(false);
      await loadItems();
    } catch {
      setCreateError("Nao foi possivel criar o item. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  function handleOpenEditModal(item: (typeof items)[0]) {
    setEditError(null);
    setEditForm({
      id: item.id,
      code: item.code,
      title: item.title,
      type: item.type as ItemType,
      currentQuantity: item.currentQuantity,
      minimumQuantity: item.minimumQuantity
    });
    setIsEditOpen(true);
  }

  function handleCloseEditModal() {
    if (editing) return;
    setIsEditOpen(false);
  }

  async function handleUpdateItem(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!editForm.code.trim() || !editForm.title.trim()) {
      setEditError("Preencha codigo e titulo.");
      return;
    }

    setEditing(true);
    setEditError(null);
    try {
      await itemsService.update(token, editForm.id, {
        code: editForm.code.trim(),
        title: editForm.title.trim(),
        type: editForm.type,
        minimumQuantity: Number(editForm.minimumQuantity),
        currentQuantity: Number(editForm.currentQuantity)
      });
      setIsEditOpen(false);
      await loadItems();
    } catch {
      setEditError("Nao foi possivel salvar o item. Tente novamente.");
    } finally {
      setEditing(false);
    }
  }

  async function handleDeleteItem(id: string, title: string) {
    if (!token) return;
    const ok = window.confirm(`Remover o item "${title}"? O item sera desativado se houver vinculos.`);
    if (!ok) return;
    setDeletingId(id);
    setError(null);
    try {
      await itemsService.remove(token, id);
      await loadItems();
    } catch {
      setError("Nao foi possivel remover o item. Verifique emprestimos em aberto.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleOpenCreateModal}
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
              <th style={{ width: 100, textAlign: "right" }}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6}>Carregando...</td>
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
                  <td>
                    <TableActions>
                      <IconButton
                        type="button"
                        title="Editar item"
                        onClick={() => handleOpenEditModal(item)}
                        aria-label="Editar"
                      >
                        <i className="bi bi-pencil" />
                      </IconButton>
                      <IconButton
                        type="button"
                        $variant="danger"
                        title="Remover item"
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteItem(item.id, item.title)}
                        aria-label="Remover"
                      >
                        <i className="bi bi-trash" />
                      </IconButton>
                    </TableActions>
                  </td>
                </tr>
              ))}
            {!loading && error && (
              <tr>
                <td colSpan={6}>{error}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>

      {isCreateOpen && (
        <Overlay onClick={handleCloseCreateModal}>
          <Modal onClick={(event) => event.stopPropagation()}>
            <Text variant="subtitle">Novo item do acervo</Text>
            <Text variant="caption" color="#6f7c9b">
              Preencha os dados para cadastrar um novo item.
            </Text>

            <FormGrid onSubmit={handleCreateItem}>
              <Field>
                <Text variant="caption">Codigo</Text>
                <Input
                  value={createForm.code}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="Ex.: LIV-001"
                />
              </Field>

              <Field>
                <Text variant="caption">Titulo</Text>
                <Input
                  value={createForm.title}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Titulo do item"
                />
              </Field>

              <Field>
                <Text variant="caption">Tipo</Text>
                <Select
                  value={createForm.type}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, type: event.target.value as ItemType }))
                  }
                >
                  <option value="BOOK">Livro</option>
                  <option value="MAGAZINE">Revista</option>
                  <option value="SUPPORT_MATERIAL">Material de apoio</option>
                </Select>
              </Field>

              <Row>
                <Field>
                  <Text variant="caption">Quantidade atual</Text>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.currentQuantity}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        currentQuantity: Number(event.target.value || 0)
                      }))
                    }
                  />
                </Field>

                <Field>
                  <Text variant="caption">Quantidade minima</Text>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.minimumQuantity}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        minimumQuantity: Number(event.target.value || 0)
                      }))
                    }
                  />
                </Field>
              </Row>

              {createError && (
                <Text variant="caption" color="#ef5b67">
                  {createError}
                </Text>
              )}

              <Actions>
                <Button type="button" variant="ghost" onClick={handleCloseCreateModal}>
                  Cancelar
                </Button>
                <Button type="submit">{creating ? "Salvando..." : "Salvar item"}</Button>
              </Actions>
            </FormGrid>
          </Modal>
        </Overlay>
      )}

      {isEditOpen && (
        <Overlay onClick={handleCloseEditModal}>
          <Modal onClick={(event) => event.stopPropagation()}>
            <Text variant="subtitle">Editar item</Text>
            <Text variant="caption" color="#6f7c9b">
              Atualize os dados do item.
            </Text>

            <FormGrid onSubmit={handleUpdateItem}>
              <Field>
                <Text variant="caption">Codigo</Text>
                <Input
                  value={editForm.code}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, code: event.target.value }))}
                />
              </Field>

              <Field>
                <Text variant="caption">Titulo</Text>
                <Input
                  value={editForm.title}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </Field>

              <Field>
                <Text variant="caption">Tipo</Text>
                <Select
                  value={editForm.type}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, type: event.target.value as ItemType }))
                  }
                >
                  <option value="BOOK">Livro</option>
                  <option value="MAGAZINE">Revista</option>
                  <option value="SUPPORT_MATERIAL">Material de apoio</option>
                </Select>
              </Field>

              <Row>
                <Field>
                  <Text variant="caption">Quantidade atual</Text>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.currentQuantity}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        currentQuantity: Number(event.target.value || 0)
                      }))
                    }
                  />
                </Field>

                <Field>
                  <Text variant="caption">Quantidade minima</Text>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.minimumQuantity}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        minimumQuantity: Number(event.target.value || 0)
                      }))
                    }
                  />
                </Field>
              </Row>

              {editError && (
                <Text variant="caption" color="#ef5b67">
                  {editError}
                </Text>
              )}

              <Actions>
                <Button type="button" variant="ghost" onClick={handleCloseEditModal}>
                  Cancelar
                </Button>
                <Button type="submit">{editing ? "Salvando..." : "Salvar alteracoes"}</Button>
              </Actions>
            </FormGrid>
          </Modal>
        </Overlay>
      )}
    </PageLayout>
  );
}