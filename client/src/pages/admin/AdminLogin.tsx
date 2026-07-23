import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = await login(email, password);
    if (err) setError(err);
    else navigate("/admin");
  };

  return (
    <div className="admin-page">
      <form className="admin-login" onSubmit={handleSubmit}>
        <h1 className="admin-login__title">Admin</h1>
        <input
          className="admin-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="admin-input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="admin-error">{error}</p>}
        <button className="btn-primary" type="submit">Ingresar</button>
      </form>
    </div>
  );
}
