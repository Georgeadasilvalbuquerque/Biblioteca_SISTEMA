import styled from "styled-components";

type TextVariant = "title" | "subtitle" | "body" | "caption";

interface TextProps {
  variant?: TextVariant;
  color?: string;
}

const sizeByVariant: Record<TextVariant, string> = {
  title: "1.25rem",
  subtitle: "1rem",
  body: "0.93rem",
  caption: "0.78rem",
};

export const Text = styled.p.withConfig({
  shouldForwardProp: (prop) => prop !== "variant" && prop !== "color"
})<TextProps>`
  font-size: ${({ variant = "body" }) => sizeByVariant[variant]};
  color: ${({ color, theme }) => color ?? theme.colors.text};
  line-height: 1.45;
`;
