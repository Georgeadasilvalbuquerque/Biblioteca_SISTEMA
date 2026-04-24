import { useState } from "react";
import { api } from "../services/api";

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    await api.post("/register", {
      nome,
      email,
      senha
    });

    alert("Usuário cadastrado!");
    window.location.href = "/";
  }

  return (
    <form onSubmit={handleRegister}>
      <h2>Cadastro</h2>

      <input placeholder="Nome" onChange={e => setNome(e.target.value)} />
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" onChange={e => setSenha(e.target.value)} />

      <button>Cadastrar</button>
    </form>
  );
}