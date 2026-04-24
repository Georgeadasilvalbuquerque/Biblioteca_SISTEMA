import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";



export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [erro, setErro] = useState<string>("");

  const navigate = useNavigate();

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !senha) {
      setErro("Preencha todos os campos");
      return;
    }

    try {
      const res = await api.post("/login", {
        email,
        senha
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("nome", res.data.nome);

      navigate("/home");

    } catch {
      setErro("Email ou senha inválidos");
    }
  }



  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        onChange={(e) => setSenha(e.target.value)}
      />

      <button type="submit">Entrar</button>

      {erro && <p>{erro}</p>}
    </form>
  );
}