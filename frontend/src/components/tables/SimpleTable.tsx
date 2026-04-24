import styled from "styled-components";
import { Card } from "../Card";

export const TableCard = styled(Card)`
  padding: 16px;
  overflow: auto;
`;

export const Table = styled.table`
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
