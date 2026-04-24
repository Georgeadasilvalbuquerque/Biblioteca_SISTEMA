import styled from "styled-components";
import { Card } from "./Card";
import { Text } from "./Text";

const Wrapper = styled(Card)`
  padding: 16px;
  display: grid;
  gap: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const CardIcon = styled.i`
  color: ${({ theme }) => theme.colors.primary};
`;

const Delta = styled(Text)<{ $positive: boolean }>`
  color: ${({ $positive, theme }) => ($positive ? theme.colors.success : theme.colors.danger)};
  font-weight: 600;
`;

interface SummaryCardProps {
  title: string;
  value: string;
  delta: string;
  positive: boolean;
}

export function SummaryCard({ title, value, delta, positive }: SummaryCardProps) {
  const iconByTitle: Record<string, string> = {
    "Itens cadastrados": "bi bi-book",
    "Entradas (mes)": "bi bi-box-arrow-in-down",
    "Saidas (mes)": "bi bi-box-arrow-up",
    "Disponiveis agora": "bi bi-journal-check"
  };

  return (
    <Wrapper>
      <Header>
        <Text variant="caption" color="#6f7c9b">
          {title}
        </Text>
        <CardIcon className={iconByTitle[title] || "bi bi-circle"} />
      </Header>
      <Text variant="title">{value}</Text>
      <Delta variant="caption" $positive={positive}>
        {delta}
      </Delta>
    </Wrapper>
  );
}
