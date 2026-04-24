import styled from "styled-components";
import { Card } from "./Card";
import { Text } from "./Text";

const Wrapper = styled(Card)`
  padding: 16px;
  display: grid;
  gap: 10px;
`;

const AlertItem = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ theme }) => theme.colors.warning};
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 4px;
`;

const AlertButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: 0.8rem;
  text-align: left;
  padding: 0;
`;

interface LowStockItem {
  code: string;
  title: string;
  qty: number;
  min: number;
}

interface AlertPanelProps {
  items: LowStockItem[];
  onSelectItem?: (code: string) => void;
}

export function AlertPanel({ items, onSelectItem }: AlertPanelProps) {
  return (
    <Wrapper>
      <Text variant="subtitle">Alertas de estoque minimo</Text>
      {items.length === 0 && (
        <Text variant="caption" color="#6f7c9b">
          Nenhum item em estado critico no momento.
        </Text>
      )}
      {items.map((item) => (
        <AlertItem key={item.code}>
          <Text variant="body">{item.title}</Text>
          <Text variant="caption" color="#6f7c9b">
            {item.code} - Disponivel: {item.qty} | Minimo: {item.min}
          </Text>
          {onSelectItem && (
            <AlertButton onClick={() => onSelectItem(item.code)}>Ver item</AlertButton>
          )}
        </AlertItem>
      ))}
    </Wrapper>
  );
}
