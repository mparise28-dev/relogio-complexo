import type { DadosRelogio, Ponteiro } from "../types";

type Props = {
  relogio: DadosRelogio | null;
};

const CENTRO = 180;
const ESCALA = 138;

function calcularPonta(ponteiro: Ponteiro) {
  return {
    x: CENTRO + ponteiro.x * ESCALA,
    y: CENTRO - ponteiro.y * ESCALA,
  };
}

export default function RelogioAnalogico({ relogio }: Props) {
  const marcacoes = Array.from({ length: 60 }, (_, indice) => {
    const angulo = ((indice * 6 - 90) * Math.PI) / 180;
    const raioExterno = 152;
    const raioInterno = indice % 5 === 0 ? 140 : 146;

    return {
      x1: CENTRO + Math.cos(angulo) * raioInterno,
      y1: CENTRO + Math.sin(angulo) * raioInterno,
      x2: CENTRO + Math.cos(angulo) * raioExterno,
      y2: CENTRO + Math.sin(angulo) * raioExterno,
      principal: indice % 5 === 0,
    };
  });

  const numeros = Array.from({ length: 12 }, (_, indice) => {
    const numero = indice === 0 ? 12 : indice;
    const angulo = ((indice * 30 - 90) * Math.PI) / 180;
    const raio = 118;

    return {
      numero,
      x: CENTRO + Math.cos(angulo) * raio,
      y: CENTRO + Math.sin(angulo) * raio,
    };
  });

  const pontaHoras = relogio ? calcularPonta(relogio.ponteiros.horas) : null;
  const pontaMinutos = relogio
    ? calcularPonta(relogio.ponteiros.minutos)
    : null;
  const pontaSegundos = relogio
    ? calcularPonta(relogio.ponteiros.segundos)
    : null;

  return (
    <div className="mostrador">
      <svg
        className="relogio-svg"
        viewBox="0 0 360 360"
        role="img"
        aria-label="Relógio analógico"
      >
        <circle cx={CENTRO} cy={CENTRO} r="162" className="aro-externo" />
        <circle cx={CENTRO} cy={CENTRO} r="156" className="face" />

        {marcacoes.map((marca, indice) => (
          <line
            key={indice}
            x1={marca.x1}
            y1={marca.y1}
            x2={marca.x2}
            y2={marca.y2}
            className={marca.principal ? "marca principal" : "marca"}
          />
        ))}

        {numeros.map((item) => (
          <text
            key={item.numero}
            x={item.x}
            y={item.y}
            className="numero"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {item.numero}
          </text>
        ))}

        {pontaHoras && (
          <line
            x1={CENTRO}
            y1={CENTRO}
            x2={pontaHoras.x}
            y2={pontaHoras.y}
            className="ponteiro horas"
          />
        )}
        {pontaMinutos && (
          <line
            x1={CENTRO}
            y1={CENTRO}
            x2={pontaMinutos.x}
            y2={pontaMinutos.y}
            className="ponteiro minutos"
          />
        )}
        {pontaSegundos && (
          <line
            x1={CENTRO}
            y1={CENTRO}
            x2={pontaSegundos.x}
            y2={pontaSegundos.y}
            className="ponteiro segundos"
          />
        )}

        <circle cx={CENTRO} cy={CENTRO} r="6" className="eixo" />
      </svg>

      <div className="horario-abaixo">
        <span className="horario-grande">{relogio?.horario ?? "--:--:--"}</span>
      </div>
    </div>
  );
}