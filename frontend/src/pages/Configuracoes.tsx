import { useEffect, useState } from "react";
import styled from "styled-components";
import { PageLayout } from "../components/PageLayout";
import { Card } from "../components/Card";
import { Text } from "../components/Text";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { ensureToken } from "../services/api";
import { settingsService } from "../services/domains/settings.service";

const Form = styled(Card)`
  padding: 18px;
  display: grid;
  gap: 12px;
  max-width: 640px;
`;

export default function Configuracoes() {
  const [token, setToken] = useState("");
  const [search, setSearch] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [form, setForm] = useState({
    defaultLoanDays: 7,
    lowStockAlertThreshold: 1,
    allowNegativeAdjustments: false
  });

  useEffect(() => {
    async function boot() {
      const authToken = await ensureToken();
      setToken(authToken);
      const settings = await settingsService.get(authToken);
      setForm(settings);
    }
    boot();
  }, []);

  async function handleSave() {
    if (!token) return;
    await settingsService.update(token, form);
    setSavedMessage("Configuracoes salvas com sucesso.");
  }

  return (
    <PageLayout
      search={search}
      onSearchChange={setSearch}
      onExportClick={undefined}
      onPrimaryClick={handleSave}
      primaryLabel="Salvar"
      placeholder="Pesquisar configuracao..."
    >
      <Form>
        <Text variant="subtitle">Configuracoes do sistema</Text>
        <label>
          <Text variant="caption">Prazo padrao de emprestimo (dias)</Text>
          <Input
            type="number"
            value={form.defaultLoanDays}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, defaultLoanDays: Number(event.target.value) || 1 }))
            }
          />
        </label>
        <label>
          <Text variant="caption">Limite para alerta de estoque minimo</Text>
          <Input
            type="number"
            value={form.lowStockAlertThreshold}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, lowStockAlertThreshold: Number(event.target.value) || 0 }))
            }
          />
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.allowNegativeAdjustments}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, allowNegativeAdjustments: event.target.checked }))
            }
          />
          <Text variant="body">Permitir ajustes negativos de estoque</Text>
        </label>
        <Button onClick={handleSave}>Salvar configuracoes</Button>
        {savedMessage && (
          <Text variant="caption" color="#26c281">
            {savedMessage}
          </Text>
        )}
      </Form>
    </PageLayout>
  );
}
