import styled from "styled-components";

interface ButtonProps {
  variant?: "primary" | "ghost";
}

export const Button = styled.button<ButtonProps>`
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;

  ${({ variant = "primary", theme }) =>
    variant === "primary"
      ? `
        background: ${theme.colors.primary};
        color: #fff;
        &:hover { opacity: 0.92; }
      `
      : `
        background: ${theme.colors.primarySoft};
        color: ${theme.colors.primary};
        &:hover { filter: brightness(0.98); }
      `}
`;
