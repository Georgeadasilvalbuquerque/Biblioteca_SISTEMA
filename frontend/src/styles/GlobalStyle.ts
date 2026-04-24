import { createGlobalStyle } from "styled-components";

// Reset simples e tokens globais para manter consistencia visual.
export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
  }

  #root {
    min-height: 100vh;
  }

  button, input {
    font: inherit;
  }
`;
