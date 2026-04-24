import styled from "styled-components";
import { Input } from "./Input";
import { Button } from "./Button";

interface TopbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onExportClick?: () => void;
  onPrimaryClick?: () => void;
  primaryLabel?: string;
  primaryIconClass?: string;
  primaryDisabled?: boolean;
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

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export function Topbar({
  search,
  onSearchChange,
  onExportClick,
  onPrimaryClick,
  primaryLabel = "Novo item",
  primaryIconClass = "bi bi-plus-circle",
  primaryDisabled,
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
        {onExportClick != null ? (
          <Button variant="ghost" onClick={onExportClick} type="button">
            <ButtonContent>
              <i className="bi bi-download" />
              Exportar
            </ButtonContent>
          </Button>
        ) : null}
        {onPrimaryClick != null ? (
          <Button onClick={onPrimaryClick} type="button" disabled={primaryDisabled}>
            <ButtonContent>
              <i className={primaryIconClass} />
              {primaryLabel}
            </ButtonContent>
          </Button>
        ) : null}
      </Actions>
    </Wrapper>
  );
}
