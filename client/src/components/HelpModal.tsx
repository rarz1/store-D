interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>¿Cómo personalizar tu prenda?</h3>
          <button className="btn-icon" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="help-steps">
          <ol>
            <li>Elegí el <strong>color</strong> y <strong>talle</strong> de tu prenda</li>
            <li>Tocá <strong>"+ Agregar estampado"</strong></li>
            <li>Elegí un <strong>diseño</strong> del catálogo</li>
            <li>Seleccioná el <strong>tamaño</strong> del estampado</li>
            <li>Arrastrá el diseño <strong>directamente sobre la prenda</strong> para ubicarlo donde quieras (frente o posterior)</li>
            <li>Confirmá y repetí si querés más estampados</li>
            <li>Agregá al <strong>carrito</strong> cuando estés listo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
