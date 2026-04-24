import styled from "styled-components";
import { Text } from "./Text";
import { NavLink } from "react-router-dom";

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

  &.active {
    background: ${({ theme }) => theme.colors.sidebarSoft};
  }
`;

export function Sidebar() {
  return (
    <Aside>
      <div>
        <Text variant="subtitle" color="#d2dcff">
          BOOK
        </Text>
        <Text variant="title" color="#fff">
          Bench
        </Text>
      </div>

      <Menu>
        <MenuItem to="/">Painel</MenuItem>
        <MenuItem to="/itens">Itens</MenuItem>
        <MenuItem to="/movimentacoes">Movimentacoes</MenuItem>
        <MenuItem to="/emprestimos">Emprestimos</MenuItem>
        <MenuItem to="/membros">Membros</MenuItem>
        <MenuItem to="/relatorios">Relatorios</MenuItem>
        <MenuItem to="/configuracoes">Configuracoes</MenuItem>
      </Menu>

      <div />
    </Aside>
  );
}
