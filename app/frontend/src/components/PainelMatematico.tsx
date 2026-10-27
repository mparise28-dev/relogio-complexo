import type { NumeroComplexo, Ponteiro, Ponteiros } from "../types";

type Props = {
  ponteiros: Ponteiros | undefined;
};

const PONTEIROS_INFO: {
  chave: keyof Ponteiros;
  rotulo: string;
  cor: string;
}[] = [
  { chave: "horas", rotulo: "PONTEIRO DAS HORAS", cor: "#1a2330" },
  { chave: "minutos", rotulo: "PONTEIRO DOS MINUTOS", cor: "#2c3e50" },
  { chave: "segundos", rotulo: "PONTEIRO DOS SEGUNDOS", cor: "#ff8a4c" },
];

function formatarNumero(valor: number): string {
  if (Math.abs(valor) < 0.0000005) return "0";
  return valor.toFixed(4).replace(".", ",");
}

function formatarComplexo(z: NumeroComplexo): string {
  const sinal = z.imaginaria < 0 ? "−" : "+";
  return `${formatarNumero(z.real)} ${sinal} ${formatarNumero(
    Math.abs(z.imaginaria),
  )}i`;
}

function formatarPonteiroComplexo(ponteiro: Ponteiro): string {
  const sinal = ponteiro.y < 0 ? "−" : "+";
  return `${formatarNumero(ponteiro.x)} ${sinal} ${formatarNumero(
    Math.abs(ponteiro.y),
  )}i`;
}

export default function PainelMatematico({ ponteiros }: Props) {
  return (
    <section className="laboratorio">
      <div className="laboratorio-topo">
        <h2>Laboratório matemático</h2>
        <span className="selo-lab">ROTAÇÃO COMPLEXA</span>
      </div>

      <div className="laboratorio-grade">
        <div className="coluna">
          <span className="rotulo-pequeno">1 · PONTO INICIAL</span>
          <strong className="formula-grande">z₀ = 1</strong>
          <span className="formula-desc">
            Ponto de partida no eixo real positivo.
          </span>
        </div>
        <div className="coluna">
          <span className="rotulo-pequeno">2 · FATOR DE ROTAÇÃO</span>
          <strong className="formula-grande">
            z = c·(cos θ + i·sen θ)
          </strong>
          <span className="formula-desc">
            Demonstra relações no plano de Argand-Gauss.
          </span>
        </div>
        <div className="coluna">
          <span className="rotulo-pequeno">3 · PONTEIRO FINAL</span>
          <strong className="formula-grande">z = x + yi</strong>
          <span className="formula-desc">
            O ponteiro é esse número complexo no plano.
          </span>
        </div>
      </div>

      {ponteiros && (
        <>
          <div className="detalhes">
            {PONTEIROS_INFO.map(({ chave, rotulo, cor }) => {
              const ponteiro = ponteiros[chave];

              return (
                <div className="cartao-ponteiro" key={chave}>
                  <div className="cartao-ponteiro-cabecalho">
                    <span
                      className="ponto-cor"
                      style={{ backgroundColor: cor, color: cor }}
                    />
                    <span className="cartao-ponteiro-titulo">{rotulo}</span>
                  </div>

                  <div className="destaque-z">
                    <span className="rotulo">Z (PONTEIRO)</span>
                    <span className="valor">
                      {formatarPonteiroComplexo(ponteiro)}
                    </span>
                  </div>

                  <div className="metricas">
                    <div className="linha-metrica">
                      <span className="rotulo">θ em graus</span>
                      <span className="valor">
                        {formatarNumero(ponteiro.angulo)}°
                      </span>
                    </div>
                    <div className="linha-metrica">
                      <span className="rotulo">θ em radianos</span>
                      <span className="valor">
                        {formatarNumero((ponteiro.angulo * Math.PI) / 180)} rad
                      </span>
                    </div>
                    <div className="linha-metrica">
                      <span className="rotulo">Direção do vetor</span>
                      <span className="valor">
                        {formatarComplexo(ponteiro.rotacao)}
                      </span>
                    </div>
                    <div className="linha-metrica">
                      <span className="rotulo">Comprimento</span>
                      <span className="valor">
                        {formatarNumero(ponteiro.comprimento)}
                      </span>
                    </div>
                  </div>

                  <div className="calculo">
                    <span className="rotulo">CÁLCULO</span>
                    <span className="valor">
                      1 × ({formatarComplexo(ponteiro.rotacao)}) ×{" "}
                      {formatarNumero(ponteiro.comprimento)}
                    </span>
                  </div>

                  <div className="coordenadas-caixa">
                    <div>
                      <span className="rotulo">Re (X)</span>
                      <span className="valor">
                        {formatarNumero(ponteiro.x)}
                      </span>
                    </div>
                    <div>
                      <span className="rotulo">Im (Y)</span>
                      <span className="valor">
                        {formatarNumero(ponteiro.y)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="rodape-lab">
            Python calcula · API transmite · React representa
          </p>
        </>
      )}
    </section>
  );
}