import styled from "styled-components";
import { Input } from "./Input";
import { Button } from "./Button";

interface TopbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onExportClick?: () => void;
  onPrimaryClick?: () => void;
  primaryLabel?: string;
  placeholder?: string;
}

const Wrapper = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

export function Topbar({
  search,
  onSearchChange,
  onExportClick,
  onPrimaryClick,
  primaryLabel = "Novo item",
  placeholder = "Pesquisar item, codigo, autor..."
}: TopbarProps) {
  return (
    <Wrapper>
      <Input
        placeholder={placeholder}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <Actions>
        <Button variant="ghost" onClick={onExportClick}>
          Exportar
        </Button>
        <Button onClick={onPrimaryClick}>{primaryLabel}</Button>
      </Actions>
    </Wrapper>
  );
}
