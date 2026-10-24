import { useState } from "react";
import AppHeader from "../../components/layout/AppHeader";
import Stepper from "../../components/layout/Stepper";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import SizeCard from "./SizeCard";

function SizePage() {
  const [tamanio, setTamanio] = useState(3);

  const tamanios = [2, 3, 4, 5];

  const continuar = () => {
    console.log(`Tamaño seleccionado: ${tamanio}x${tamanio}`);
  };

  return (
    <>
      <AppHeader />

      <main className="page-container">
        <Stepper pasoActual={1} />

        <section className="size-page">
          <div className="size-page__intro">
            <Badge className="eyebrow">Paso 1 de 4</Badge>

            <h2>Elige el tamaño del sistema</h2>

            <p>
              Selecciona la cantidad de incógnitas y ecuaciones que deseas
              resolver con el método de Gauss-Jordan.
            </p>
          </div>

          <div className="size-grid">
            {tamanios.map((size) => (
              <SizeCard
                key={size}
                size={size}
                seleccionado={tamanio === size}
                onSeleccionar={setTamanio}
              />
            ))}
          </div>

          <Card className="size-page__footer">
            <p>
              Sistema seleccionado:
              <strong>
                {" "}
                {tamanio} × {tamanio}
              </strong>
            </p>

            <Button onClick={continuar}>
                 Continuar
                 <span aria-hidden="true">→</span>
            </Button>
          </Card>
        </section>
      </main>
    </>
  );
}

export default SizePage;