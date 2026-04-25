import { useState, type FormEvent } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Text } from "../components/Text";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import {
  LoginBgImage,
  LoginBgOverlay,
  LoginShell,
  LoginCard,
  LoginField,
  LoginErrorText,
  LoginHead,
  LoginSubmitRow
} from "../components/LoginLayout";
import {
  clearRedirectAfterLogin,
  getRedirectAfterLogin,
  getStoredToken,
  loginRequest,
  setStoredToken
} from "../services/api";

type LocationState = { from?: { pathname?: string } };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as LocationState | null)?.from?.pathname;
  const fromStorage = getRedirectAfterLogin();
  const from = fromState || fromStorage || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginRequest({ email: email.trim(), password });
      setStoredToken(result.token);
      clearRedirectAfterLogin();
      navigate(from, { replace: true });
    } catch {
      setError("E-mail ou senha invalidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (getStoredToken()) {
    clearRedirectAfterLogin();
    return <Navigate to={from} replace />;
  }

  return (
    <LoginShell>
      <LoginBgImage aria-hidden />
      <LoginBgOverlay aria-hidden />
      <LoginCard as="form" onSubmit={handleSubmit}>
        <LoginHead>
          <Text variant="title" color="#0f1f4a">
            Biblioteca
          </Text>
          <Text variant="caption" color="#6f7c9b">
            Entre com seu e-mail e senha para acessar o sistema.
          </Text>
        </LoginHead>

        {error && <LoginErrorText role="alert">{error}</LoginErrorText>}

        <LoginField>
          <Text variant="caption">E-mail</Text>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />
        </LoginField>

        <LoginField>
          <Text variant="caption">Senha</Text>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />
        </LoginField>

        <LoginSubmitRow>
          <Button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </LoginSubmitRow>
      </LoginCard>
    </LoginShell>
  );
}