import React, { useState, useEffect } from "react";
import "./App.css";

interface Interest {
  id?: number;
  name: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

function AdminApp() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [name, setName] = useState("");

  const fetchInterests = async () => {
    try {
      const res = await fetch(`${API_URL}/interest`);
      if (res.ok) {
        const data = await res.json();
        setInterests(data);
      }
    } catch (e) {
      console.error("Error fetching interests", e);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch(`${API_URL}/interest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setName("");
        fetchInterests();
      }
    } catch (e) {
      console.error("Error creating interest", e);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/interest/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInterests();
      }
    } catch (e) {
      console.error("Error deleting interest", e);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">Admin – Intereses</h1>
      <form className="interest-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre del interés"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="interest-input"
        />
        <button type="submit" className="interest-button">Añadir</button>
      </form>
      <ul className="interest-list">
        {interests.map((i) => (
          <li key={i.id} className="interest-item">
            {i.name}
            <button className="delete-button" onClick={() => handleDelete(i.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminApp;
