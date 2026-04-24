import { db } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function login(req, res) {
  const { email, senha } = req.body;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM usuario WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = rows[0];

    //const senhaValida = await bcrypt.compare(senha, user.senha);
    const senhaValida = senha === user.senha;

    if (!senhaValida) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    const token = jwt.sign(
      { id: user.id_usuario },
      "segredo"
    );

    res.json({
      token,
      nome: user.nome
    });

  } catch (err) {
    res.status(500).json({ error: "Erro no servidor" });
  }
}