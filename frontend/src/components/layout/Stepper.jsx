const pasos = [
  { numero: 1, nombre: "Tamaño" },
  { numero: 2, nombre: "Datos" },
  { numero: 3, nombre: "Procedimiento" },
  { numero: 4, nombre: "Resultado" },
];

function Stepper({ pasoActual = 1 }) {
  return (
    <nav className="stepper" aria-label="Progreso de resolución">
      {pasos.map((paso) => {
        const activo = paso.numero === pasoActual;
        const completado = paso.numero < pasoActual;

        return (
          <div
            className={`stepper__item ${
              activo ? "stepper__item--activo" : ""
            } ${completado ? "stepper__item--completado" : ""}`}
            key={paso.numero}
          >
            <div className="stepper__circle">
              {completado ? "✓" : paso.numero}
            </div>

            <span>{paso.nombre}</span>

            {paso.numero < pasos.length && (
              <div className="stepper__line" />
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default Stepper;