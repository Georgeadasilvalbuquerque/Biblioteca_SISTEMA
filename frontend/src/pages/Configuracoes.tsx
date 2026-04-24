import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { PageLayout } from "../components/PageLayout";
import { Text } from "../components/Text";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { ensureToken } from "../services/api";
import { settingsService } from "../services/domains/settings.service";

const PageHeader = styled.div`
  display: grid;
  gap: 8px;
  max-width: 800px;
`;

const Layout = styled.div`
  max-width: 800px;
  display: grid;
  gap: 16px;
`;

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: 20px 22px;
  display: grid;
  gap: 16px;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const SectionIcon = styled.i`
  font-size: 1.35rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 2px;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
  max-width: 320px;
`;

const FieldHint = styled.span`
  font-size: 0.78rem;
  color: #6f7c9b;
  line-height: 1.35;
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 14px 0 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ToggleText = styled.div`
  display: grid;
  gap: 4px;
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const SwitchTrack = styled.span<{ $on: boolean }>`
  position: relative;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${({ $on, theme }) => ($on ? theme.colors.primary : "#d5dbe8")};
  transition: background 0.2s ease;
  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? "21px" : "3px")};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: left 0.2s ease;
  }
`;

const SwitchWrap = styled.span`
  position: relative;
  display: inline-flex;
  margin-top: 2px;
`;

const MessageBanner = styled.div<{ $variant: "success" | "error" }>`
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.88rem;
  line-height: 1.4;
  background: ${({ $variant }) => ($variant === "success" ? "rgba(38, 194, 129, 0.12)" : "rgba(239, 91, 103, 0.12)")};
  color: ${({ $variant, theme }) => ($variant === "success" ? theme.colors.success : theme.colors.danger)};
  border: 1px solid
    ${({ $variant }) => ($variant === "success" ? "rgba(38, 194, 129, 0.35)" : "rgba(239, 91, 103, 0.35)")};
`;

const FooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding-top: 4px;
`;

export default function Configuracoes() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    defaultLoanDays: 7,
    lowStockAlertThreshold: 1,
    allowNegativeAdjustments: false
  });

  const [initial, setInitial] = useState(form);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    async function boot() {
      if (bootstrappedRef.current) return;
      bootstrappedRef.current = true;
      setLoading(true);
      setLoadError(null);
      try {
        const authToken = await ensureToken();
        setToken(authToken);
        const settings = await settingsService.get(authToken);
        setForm(settings);
        setInitial(settings);
      } catch {
        setLoadError("Nao foi possivel carregar as configuracoes.");
      } finally {
        setLoading(false);
      }
    }
    void boot();
  }, []);

  function handleReset() {
    setForm(initial);
    setSaveError(null);
    setSuccessMessage("");
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    setSuccessMessage("");
    try {
      const updated = await settingsService.update(token, form);
      setForm(updated);
      setInitial(updated);
      setSuccessMessage("Configuracoes salvas com sucesso.");
    } catch {
      setSaveError("Nao foi possivel salvar. Verifique os valores e tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty =
    form.defaultLoanDays !== initial.defaultLoanDays ||
    form.lowStockAlertThreshold !== initial.lowStockAlertThreshold ||
    form.allowNegativeAdjustments !== initial.allowNegativeAdjustments;

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onPrimaryClick={handleSave}
      primaryLabel={saving ? "Salvando..." : "Salvar alteracoes"}
      primaryIconClass="bi bi-check2"
      primaryDisabled={loading || saving}
      placeholder="Configuracoes (busca desativada)"
    >
      <PageHeader>
        <Text variant="title" color="#0f1f4a">
          Configuracoes
        </Text>
        <Text variant="caption" color="#6f7c9b">
          Defina regras padrao de empréstimo, alertas de estoque e opções de ajuste. As alteracoes valem para os
          proximos fluxos do sistema.
        </Text>
      </PageHeader>

      {loadError && <MessageBanner $variant="error">{loadError}</MessageBanner>}
      {saveError && <MessageBanner $variant="error">{saveError}</MessageBanner>}
      {successMessage && <MessageBanner $variant="success">{successMessage}</MessageBanner>}

      {loading ? (
        <Text variant="body" color="#6f7c9b">
          Carregando configuracoes...
        </Text>
      ) : (
        <Layout>
          <Section>
            <SectionHead>
              <SectionIcon className="bi bi-journal-text" />
              <div>
                <Text variant="subtitle">Emprestimos</Text>
                <Text variant="caption" color="#6f7c9b">
                  Valores usados como padrao ao criar emprestimos pela interface.
                </Text>
              </div>
            </SectionHead>
            <Field>
              <Text variant="caption">Prazo padrao (dias)</Text>
              <Input
                type="number"
                min={1}
                max={90}
                value={form.defaultLoanDays}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    defaultLoanDays: Math.min(90, Math.max(1, Number(event.target.value) || 1))
                  }));
                  setSuccessMessage("");
                }}
              />
              <FieldHint>Entre 1 e 90 dias. Sugestao: 7 para bibliotecas comunitarias.</FieldHint>
            </Field>
          </Section>

          <Section>
            <SectionHead>
              <SectionIcon className="bi bi-box-seam" />
              <div>
                <Text variant="subtitle">Estoque e alertas</Text>
                <Text variant="caption" color="#6f7c9b">
                  Controle de avisos de estoque e seguranca de movimentacao.
                </Text>
              </div>
            </SectionHead>
            <Field>
              <Text variant="caption">Alerta de estoque minimo (unidades)</Text>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.lowStockAlertThreshold}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    lowStockAlertThreshold: Math.min(100, Math.max(0, Number(event.target.value) || 0))
                  }));
                  setSuccessMessage("");
                }}
              />
              <FieldHint>Quando a quantidade do item for menor ou igual a este valor, o sistema reforca o alerta.</FieldHint>
            </Field>

            <ToggleRow htmlFor="allow-neg">
              <SwitchWrap>
                <HiddenCheckbox
                  id="allow-neg"
                  type="checkbox"
                  checked={form.allowNegativeAdjustments}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, allowNegativeAdjustments: event.target.checked }));
                    setSuccessMessage("");
                  }}
                />
                <SwitchTrack $on={form.allowNegativeAdjustments} />
              </SwitchWrap>
              <ToggleText>
                <Text variant="body">Permitir ajustes que deixem estoque negativo</Text>
                <Text variant="caption" color="#6f7c9b">
                  Desative em ambientes que exigem trilha de quantidade sempre positiva.
                </Text>
              </ToggleText>
            </ToggleRow>
          </Section>

          <FooterActions>
            <Button type="button" variant="ghost" onClick={handleReset} disabled={!isDirty || saving}>
              Descartar alteracoes
            </Button>
            <Text variant="caption" color="#6f7c9b">
              {isDirty ? "Voce tem alteracoes nao salvas." : "Tudo salvo com a ultima versao em disco."}
            </Text>
          </FooterActions>
        </Layout>
      )}
    </PageLayout>
  );
}
