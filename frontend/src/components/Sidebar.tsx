import styled from "styled-components";
import { Text } from "./Text";
import { NavLink, useNavigate } from "react-router-dom";
import { clearStoredToken } from "../services/api";

const Aside = styled.aside`
  background: ${({ theme }) => theme.colors.sidebar};
  color: #fff;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 24px 18px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    border-radius: ${({ theme }) => theme.radius.md};
  }
`;

const Menu = styled.nav`
  display: grid;
  gap: 6px;
`;

const MenuItem = styled(NavLink)`
  text-decoration: none;
  color: #fff;
  text-align: left;
  border-radius: 10px;
  background: transparent;
  padding: 11px 12px;
  cursor: pointer;
  font-size: 0.93rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;

  &.active {
    background: ${({ theme }) => theme.colors.sidebarSoft};
  }
`;

const LogoutButton = styled.button`
  text-decoration: none;
  color: #c8d4f5;
  text-align: left;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 11px 12px;
  cursor: pointer;
  font-size: 0.93rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.sidebarSoft};
    color: #fff;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BrandIcon = styled.i`
  font-size: 1.4rem;
  color: #d2dcff;
`;

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <Aside>
      <Brand>
        <BrandIcon className="bi bi-journal-bookmark-fill" />
        <div>
          <Text variant="subtitle" color="#d2dcff">
            BOOK
          </Text>
          <Text variant="title" color="#fff">
            Bench
          </Text>
        </div>
      </Brand>

      <Menu>
        <MenuItem to="/">
          <i className="bi bi-speedometer2" />
          Painel
        </MenuItem>
        <MenuItem to="/itens">
          <i className="bi bi-book" />
          Itens
        </MenuItem>
        <MenuItem to="/movimentacoes">
          <i className="bi bi-arrow-left-right" />
          Movimentacoes
        </MenuItem>
        <MenuItem to="/emprestimos">
          <i className="bi bi-journal-check" />
          Emprestimos
        </MenuItem>
        <MenuItem to="/membros">
          <i className="bi bi-people" />
          Membros
        </MenuItem>
        <MenuItem to="/relatorios">
          <i className="bi bi-bar-chart-line" />
          Relatorios
        </MenuItem>
        <MenuItem to="/configuracoes">
          <i className="bi bi-gear" />
          Configuracoes
        </MenuItem>
      </Menu>

      <LogoutButton
        type="button"
        onClick={() => {
          clearStoredToken();
          navigate("/login", { replace: true });
        }}
      >
        <i className="bi bi-box-arrow-left" />
        Sair
      </LogoutButton>
    </Aside>
  );
}
