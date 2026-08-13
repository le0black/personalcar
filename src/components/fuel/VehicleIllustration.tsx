import type { VehicleTipo } from "@/lib/vehicle-database";

type Props = {
  tipo: VehicleTipo;
  className?: string;
};

/**
 * Silhueta SVG do veículo por tipo de carroceria (carro, SUV, picape, moto).
 * Usa currentColor — a cor vem da classe de texto do elemento pai.
 * Autossuficiente: sem imagens externas.
 */
export function VehicleIllustration({ tipo, className }: Props) {
  return (
    <svg
      viewBox="0 0 64 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[tipo]}
    </svg>
  );
}

const wheels = (
  <>
    <circle cx="20" cy="24" r="4" fill="currentColor" stroke="none" />
    <circle cx="46" cy="24" r="4" fill="currentColor" stroke="none" />
  </>
);

const shapes: Record<VehicleTipo, React.ReactNode> = {
  // Hatch/sedã
  carro: (
    <>
      <path d="M6 24c-1.5 0-2-0.7-2-2v-2c0-1.6 1-2.5 3-2.8l6-0.9 4.5-4.4c1-1 2.3-1.5 3.7-1.5h12c1.7 0 3.3 0.8 4.3 2.2l2.7 3.9 6 1.4c2 0.5 3 1.5 3 3.1v1.5c0 1.3-0.6 2-2 2" />
      <path d="M17 11.4 18 18M35 11 36 18M13 18h32" />
      {wheels}
    </>
  ),
  // SUV / crossover — teto mais alto e reto
  suv: (
    <>
      <path d="M6 24c-1.5 0-2-0.7-2-2v-3c0-1.6 1-2.4 3-2.7l4-0.6V11c0-1.7 1.3-3 3-3h26c1.5 0 2.6 0.7 3.2 2l2.3 5 5.5 0.8c2 0.3 3 1.3 3 3v2c0 1.3-0.6 2-2 2" />
      <path d="M11 17.7V9M31 9v8.5M11 17.5h30" />
      {wheels}
    </>
  ),
  // Picape — cabine na frente e caçamba baixa atrás
  picape: (
    <>
      <path d="M6 24c-1.5 0-2-0.7-2-2v-2.5c0-1.6 1-2.4 3-2.6l5-0.6 3.5-5.2c0.7-1 1.7-1.5 3-1.5h9c1.4 0 2.5 1.1 2.5 2.5V17H55c2.2 0 3 1 3 2.8V22c0 1.3-0.6 2-2 2" />
      <path d="M16.5 11 17.5 17M32 11v6M13 17h19" />
      {wheels}
    </>
  ),
  // Moto
  moto: (
    <>
      <circle cx="14" cy="21" r="6.5" fill="none" />
      <circle cx="50" cy="21" r="6.5" fill="none" />
      <path d="M14 21 22 10h6" />
      <path d="M20 16h13l5-5h6l3 6" />
      <path d="M33 16c4 0 6 2 9 5" />
      <path d="M22 16l-4 5" />
    </>
  ),
};
