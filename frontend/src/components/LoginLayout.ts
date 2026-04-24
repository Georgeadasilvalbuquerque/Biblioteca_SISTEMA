import styled from "styled-components";
import loginBg from "../assets/bibliotecaFudor.svg";

export const LoginBgImage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: url(${loginBg});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

export const LoginBgOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(
    145deg,
    rgba(15, 31, 74, 0.92) 0%,
    rgba(15, 31, 74, 0.62) 45%,
    rgba(79, 124, 255, 0.18) 100%
  );
`;

export const LoginShell = styled.div`
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 18px;
  isolation: isolate;
`;

export const LoginCard = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.card}, 0 24px 48px rgba(15, 31, 74, 0.2);
  padding: 32px 28px 30px;
  display: grid;
  gap: 20px;
`;

export const LoginField = styled.label`
  display: grid;
  gap: 8px;
`;

export const LoginErrorText = styled.p`
  margin: 0;
  font-size: 0.86rem;
  color: ${({ theme }) => theme.colors.danger};
  line-height: 1.35;
`;

export const LoginHead = styled.div`
  display: grid;
  gap: 8px;
  text-align: center;
`;

export const LoginSubmitRow = styled.div`
  padding-top: 4px;
`;
