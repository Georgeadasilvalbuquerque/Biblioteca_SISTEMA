import styled from "styled-components";
import { Card } from "./Card";
import { Text } from "./Text";

const Wrapper = styled(Card)`
  padding: 18px;
`;

const DonutContainer = styled.div`
  margin: 20px auto 16px;
  width: 240px;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  position: relative;
  display: grid;
  place-items: center;
`;

const DonutRing = styled.div<{
  availablePercent: number;
  rentedPercent: number;
  overduePercent: number;
}>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${({ availablePercent, rentedPercent, overduePercent }) =>
    `conic-gradient(
      #166be0 0 ${availablePercent}%,
      #f6cc4f ${availablePercent}% ${availablePercent + rentedPercent}%,
      #f4564c ${availablePercent + rentedPercent}% ${availablePercent + rentedPercent + overduePercent}%
    )`};
`;

const DonutHole = styled.div`
  position: absolute;
  width: 72%;
  height: 72%;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Legend = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const LegendItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
`;

const IconBadge = styled.div<{ tone: "available" | "rented" | "overdue" }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: #ffffff;
  background: ${({ tone }) =>
    tone === "available" ? "#166be0" : tone === "rented" ? "#f6cc4f" : "#f4564c"};
`;

const ValueText = styled(Text)`
  font-size: 32px;
  line-height: 1;
  font-weight: 700;
`;

interface InventoryChartProps {
  values: {
    available: number;
    rented: number;
    overdue: number;
  };
}

export function InventoryChart({ values }: InventoryChartProps) {
  const total = Math.max(values.available + values.rented + values.overdue, 1);
  const availablePercent = Math.round((values.available / total) * 100);
  const rentedPercent = Math.round((values.rented / total) * 100);
  const overduePercent = Math.max(0, 100 - availablePercent - rentedPercent);

  return (
    <Wrapper>
      <Text variant="subtitle">Status do acervo</Text>
      <Text variant="caption" color="#6f7c9b">
        Visao geral de livros disponiveis, alugados e em atraso.
      </Text>
      <DonutContainer>
        <DonutRing
          availablePercent={availablePercent}
          rentedPercent={rentedPercent}
          overduePercent={overduePercent}
        />
        <DonutHole />
      </DonutContainer>

      <Legend>
        <LegendItem>
          <IconBadge tone="available">L</IconBadge>
          <Text variant="caption" color="#6f7c9b">
            Livro disponivel
          </Text>
          <ValueText variant="title" color="#166be0">
            {availablePercent}%
          </ValueText>
        </LegendItem>

        <LegendItem>
          <IconBadge tone="rented">A</IconBadge>
          <Text variant="caption" color="#6f7c9b">
            Livros alugados
          </Text>
          <ValueText variant="title" color="#f6cc4f">
            {rentedPercent}%
          </ValueText>
        </LegendItem>

        <LegendItem>
          <IconBadge tone="overdue">!</IconBadge>
          <Text variant="caption" color="#6f7c9b">
            Livros em atrasos
          </Text>
          <ValueText variant="title" color="#f4564c">
            {overduePercent}%
          </ValueText>
        </LegendItem>
      </Legend>
    </Wrapper>
  );
}
