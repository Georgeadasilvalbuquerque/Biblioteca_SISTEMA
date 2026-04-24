export default function Home() {
  const nome = localStorage.getItem("nome");

  function logout() {
    localStorage.clear();
    window.location.href = "/";
  }

  return (
    <div>
      <h1>Bem-vindo, {nome}</h1>

      <button onClick={logout}>Logout</button>

      <div>
        <a href="/itens">Cadastro de Itens</a>
        <a href="/estoque">Controle de Estoque</a>
      </div>
    </div>
  );
}