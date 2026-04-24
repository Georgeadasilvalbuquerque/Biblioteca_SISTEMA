import styled from "styled-components";
import { Card } from "./Card";
import { Text } from "./Text";

const Wrapper = styled(Card)`
  padding: 16px;
  display: grid;
  gap: 8px;
`;

const Delta = styled(Text)<{ positive: boolean }>`
  color: ${({ positive, theme }) => (positive ? theme.colors.success : theme.colors.danger)};
  font-weight: 600;
`;

interface SummaryCardProps {
  title: string;
  value: string;
  delta: string;
  positive: boolean;
}

export function SummaryCard({ title, value, delta, positive }: SummaryCardProps) {
  return (
    <Wrapper>
      <Text variant="caption" color="#6f7c9b">
        {title}
      </Text>
      <Text variant="title">{value}</Text>
      <Delta variant="caption" positive={positive}>
        {delta}
      </Delta>
    </Wrapper>
  );
}
