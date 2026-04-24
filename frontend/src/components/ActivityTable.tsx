import styled from "styled-components";
import { Card } from "./Card";
import { Text } from "./Text";

const Wrapper = styled(Card)`
  padding: 16px;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th,
  td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.88rem;
  }

  th {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 600;
  }
`;

interface Row {
  date: string;
  type: string;
  item: string;
  qty: number;
}

interface ActivityTableProps {
  rows: Row[];
  onRowClick?: (row: Row) => void;
}

export function ActivityTable({ rows, onRowClick }: ActivityTableProps) {
  return (
    <Wrapper>
      <Text variant="subtitle">Ultimas atividades</Text>
      <Table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Item</th>
            <th>Qtd</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4}>Sem atividades recentes.</td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr
              key={`${row.item}-${index}`}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? "pointer" : "default" }}
            >
              <td>{row.date}</td>
              <td>{row.type}</td>
              <td>{row.item}</td>
              <td>{row.qty}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}
