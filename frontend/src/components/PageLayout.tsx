import styled from "styled-components";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { ReactNode } from "react";

const Layout = styled.main`
  min-height: 100vh;
  padding: 18px;
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 220px 1fr;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const Content = styled.section`
  display: grid;
  gap: 16px;
  align-content: start;
`;

interface PageLayoutProps {
  search: string;
  onSearchChange: (value: string) => void;
  onExportClick?: () => void;
  onPrimaryClick?: () => void;
  primaryLabel?: string;
  primaryIconClass?: string;
  primaryDisabled?: boolean;
  placeholder?: string;
  children: ReactNode;
}

export function PageLayout({
  search,
  onSearchChange,
  onExportClick,
  onPrimaryClick,
  primaryLabel,
  primaryIconClass,
  primaryDisabled,
  placeholder,
  children
}: PageLayoutProps) {
  return (
    <Layout>
      <Sidebar />
      <Content>
        <Topbar
          search={search}
          onSearchChange={onSearchChange}
          onExportClick={onExportClick}
          onPrimaryClick={onPrimaryClick}
          primaryLabel={primaryLabel}
          primaryIconClass={primaryIconClass}
          primaryDisabled={primaryDisabled}
          placeholder={placeholder}
        />
        {children}
      </Content>
    </Layout>
  );
}
