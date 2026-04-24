import styled from "styled-components";
import { Card } from "./Card";
import { Text } from "./Text";
import { useMemo, useState } from "react";

const Wrapper = styled(Card)`
  padding: 18px;
`;

const Bars = styled.div`
  margin-top: 14px;
  height: 240px;
  display: grid;
  grid-template-columns: repeat(12, minmax(10px, 1fr));
  align-items: end;
  gap: 8px;
`;

const Bar = styled.div<{ value: number }>`
  background: linear-gradient(180deg, #66c9ff 0%, #4f7cff 100%);
  border-radius: 8px 8px 4px 4px;
  min-height: 18px;
  height: ${({ value }) => `${value}%`};
`;

const Tooltip = styled(Text)`
  margin-top: 8px;
`;

interface InventoryChartProps {
  values: number[];
  labels?: string[];
}

export function InventoryChart({ values, labels = [] }: InventoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const safeLabels = useMemo(
    () => values.map((_, index) => labels[index] || `Periodo ${index + 1}`),
    [labels, values]
  );

  return (
    <Wrapper>
      <Text variant="subtitle">Fluxo de movimentacoes</Text>
      <Text variant="caption" color="#6f7c9b">
        Entradas e saidas consolidadas por periodo.
      </Text>
      <Bars>
        {values.map((value, index) => (
          <Bar
            key={`${value}-${index}`}
            value={value}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            title={`${safeLabels[index]}: ${Math.round(value)}`}
          />
        ))}
      </Bars>
      {hoveredIndex !== null && (
        <Tooltip variant="caption" color="#6f7c9b">
          {safeLabels[hoveredIndex]} - intensidade {Math.round(values[hoveredIndex])}
        </Tooltip>
      )}
    </Wrapper>
  );
}
