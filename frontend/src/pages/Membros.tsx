import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Table, TableCard } from "../components/tables/SimpleTable";
import { ensureToken } from "../services/api";
import { membersService } from "../services/domains/members.service";
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

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export default function Membros() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Array<{ id: string; name: string; email?: string | null; phone?: string | null; isActive: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
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
      const data = await membersService.list(currentToken, search);
      setMembers(data);
    } catch {
      setMembers([]);
      setError("Nao foi possivel carregar os membros no momento.");
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
    await membersService.export(token, format, search);
  }

  function handleOpenCreateModal() {
    setCreateError(null);
    setCreateForm({ name: "", email: "", phone: "" });
    setIsCreateOpen(true);
  }

  function handleCloseCreateModal() {
    if (creating) return;
    setIsCreateOpen(false);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!createForm.name.trim()) {
      setCreateError("Informe o nome do membro.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await membersService.create(token, {
        name: createForm.name.trim(),
        email: createForm.email.trim() || undefined,
        phone: createForm.phone.trim() || undefined
      });
      setIsCreateOpen(false);
      await loadData();
    } catch {
      setCreateError("Nao foi possivel cadastrar o membro.");
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(
    () => members.filter((member) => member.name.toLowerCase().includes(search.toLowerCase())),
    [members, search]
  );

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={handleExport}
      onPrimaryClick={handleOpenCreateModal}
      primaryLabel="Novo membro"
      placeholder="Pesquisar membro por nome/email..."
    >
      <TableCard>
        <Text variant="subtitle">Membros</Text>
        <Table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4}>Carregando...</td>
              </tr>
            )}
            {!loading &&
              filtered.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.email || "-"}</td>
                  <td>{member.phone || "-"}</td>
                  <td>{member.isActive ? "Ativo" : "Inativo"}</td>
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
            <Text variant="subtitle">Novo membro</Text>
            <Text variant="caption" color="#6f7c9b">
              Preencha os dados para cadastrar um novo membro.
            </Text>

            <FormGrid onSubmit={handleCreate}>
              <Field>
                <Text variant="caption">Nome</Text>
                <Input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Nome do membro"
                />
              </Field>

              <Field>
                <Text variant="caption">Email (opcional)</Text>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </Field>

              <Field>
                <Text variant="caption">Telefone (opcional)</Text>
                <Input
                  value={createForm.phone}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="(00) 00000-0000"
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
                <Button type="submit">{creating ? "Salvando..." : "Salvar membro"}</Button>
              </Actions>
            </FormGrid>
          </Modal>
        </Overlay>
      )}
    </PageLayout>
  );
}
