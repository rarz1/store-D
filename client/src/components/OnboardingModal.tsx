import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: "🎨",
    title: "Personalizá tu prenda",
    desc: "Elegí color, talla y agregá diseños exclusivos",
  },
  {
    icon: "👁️",
    title: "Vista previa en tiempo real",
    desc: "Mirá cómo queda el diseño en la prenda antes de confirmar",
  },
  {
    icon: "📱",
    title: "Compra por WhatsApp",
    desc: "Consultá tu carrito o configurá tu prenda directamente",
  },
];

export default function OnboardingModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const seen = localStorage.getItem("onboarding_seen");
    if (seen) {
      setDismissed(true);
    }
  }, [open]);

  if (!open || dismissed) return null;

  const handleClose = () => {
    setDismissed(true);
    localStorage.setItem("onboarding_seen", "true");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Bienvenido a STORE</h3>
          <button className="btn-icon" onClick={handleClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "0 1.5rem 1.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", justifyContent: "center" }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i === step ? "var(--accent)" : "var(--border)",
                  transition: "background 200ms ease",
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.75rem" }}>{STEPS[step].icon}</span>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text)", margin: "0 0 0.5rem", letterSpacing: "0.04em" }}>
              {STEPS[step].title}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
              {STEPS[step].desc}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            {step > 0 && (
              <button className="btn-small" onClick={() => setStep((s) => s - 1)} type="button">
                Anterior
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setStep((s) => s + 1)} type="button" style={{ width: "auto", padding: "0.75rem 2rem" }}>
                Siguiente
              </button>
            ) : (
              <button className="btn-primary" onClick={handleClose} type="button" style={{ width: "auto", padding: "0.75rem 2rem" }}>
                Empezar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}