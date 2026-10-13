import { useEffect, useRef, useState } from "react";
import "./App.css";

type NumeroComplexo = {
  real: number;
  imaginaria: number;
};

type Ponteiro = {
  angulo: number;
  comprimento: number;
  x: number;
  y: number;
  rotacao: NumeroComplexo;
  multiplicacao: NumeroComplexo;
};

type DadosRelogio = {
  horario: string;
  ponteiros: {
    horas: Ponteiro;
    minutos: Ponteiro;
    segundos: Ponteiro;
  };
};

type InicioRelogio = {
  horario: string;
  instante: number;
};

type ChavePonteiro = "horas" | "minutos" | "segundos";

const API_URL = "http://127.0.0.1:8000";

const PONTEIROS_INFO: {
  chave: ChavePonteiro;
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

function formatarPonteiroComplexo(p: Ponteiro): string {
  const sinal = p.y < 0 ? "−" : "+";
  return `${formatarNumero(p.x)} ${sinal} ${formatarNumero(Math.abs(p.y))}i`;
}

function obterHorarioDecorrido(inicio: InicioRelogio): string {
  const partes = inicio.horario.split(":").map(Number);
  const [horas = 0, minutos = 0, segundos = 0] = partes;

  const segundosIniciais = horas * 3600 + minutos * 60 + segundos;
  const segundosDecorridos = Math.floor((Date.now() - inicio.instante) / 1000);

  const total =
    (((segundosIniciais + segundosDecorridos) % 86400) + 86400) % 86400;

  const horaAtual = Math.floor(total / 3600);
  const minutoAtual = Math.floor((total % 3600) / 60);
  const segundoAtual = total % 60;

  return [horaAtual, minutoAtual, segundoAtual]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
}

function obterHorarioBrasilia(): string {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const valor = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "00";

  return `${valor("hour")}:${valor("minute")}:${valor("second")}`;
}

function App() {
  const [relogio, setRelogio] = useState<DadosRelogio | null>(null);
  const [erro, setErro] = useState("");
  const [horarioInicial, setHorarioInicial] = useState(obterHorarioBrasilia);
  const [horarioAlarme, setHorarioAlarme] = useState("10:10:40");
  const [mensagemAlarme, setMensagemAlarme] = useState("");
  const [alarmeAtivo, setAlarmeAtivo] = useState(false);
  const [alarmeTocando, setAlarmeTocando] = useState(false);
  const [inicioRelogio, setInicioRelogio] = useState<InicioRelogio>(() => ({
    horario: obterHorarioBrasilia(),
    instante: Date.now(),
  }));
  const [editandoInicial, setEditandoInicial] = useState(false);
  const [editandoAlarme, setEditandoAlarme] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  // ------------------------------------------------------------------
  // 1) Consulta o backend para calcular a posição dos ponteiros
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelado = false;
    let controller: AbortController | null = null;

    async function atualizarRelogio() {
      const horario = obterHorarioDecorrido(inicioRelogio);

      controller?.abort();
      controller = new AbortController();

      try {
        const resposta = await fetch(
          `${API_URL}/api/relogio?horario=${encodeURIComponent(horario)}`,
          { signal: controller.signal },
        );

        if (!resposta.ok) {
          throw new Error(`A API respondeu com status ${resposta.status}.`);
        }

        const dados: DadosRelogio = await resposta.json();

        if (
          !dados.ponteiros?.horas ||
          !dados.ponteiros?.minutos ||
          !dados.ponteiros?.segundos
        ) {
          throw new Error("A API não retornou os três ponteiros.");
        }

        if (!cancelado) {
          setRelogio(dados);
          setErro("");
        }
      } catch (falha) {
        if (falha instanceof DOMException && falha.name === "AbortError")
          return;
        if (!cancelado) {
          setErro(
            falha instanceof Error
              ? falha.message
              : "Não foi possível conectar à API Python.",
          );
        }
      }
    }

    atualizarRelogio();
    const intervalo = window.setInterval(atualizarRelogio, 1000);

    return () => {
      cancelado = true;
      controller?.abort();
      window.clearInterval(intervalo);
    };
  }, [inicioRelogio]);

  // ------------------------------------------------------------------
  // 2) Verifica se o alarme disparou
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!alarmeAtivo || alarmeTocando) return;

    const intervalo = window.setInterval(() => {
      const agora = relogio?.horario ?? obterHorarioDecorrido(inicioRelogio);
      if (agora === horarioAlarme) {
        setAlarmeTocando(true);
        setMensagemAlarme("🔔 ALARME DISPARADO!");
      }
    }, 400);

    return () => window.clearInterval(intervalo);
  }, [alarmeAtivo, alarmeTocando, horarioAlarme, relogio, inicioRelogio]);

  // ------------------------------------------------------------------
  // 3) Bipes enquanto o alarme toca
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!alarmeTocando) return;
    const contexto = audioContextRef.current;
    if (!contexto) return;

    if (contexto.state === "suspended") {
      contexto.resume().catch(() => {});
    }

    function tocarBipe() {
      if (!contexto || contexto.state !== "running") return;

      const oscilador = contexto.createOscillator();
      const volume = contexto.createGain();

      oscilador.type = "sine";
      oscilador.frequency.value = 880;
      volume.gain.setValueAtTime(0.12, contexto.currentTime);
      volume.gain.exponentialRampToValueAtTime(
        0.001,
        contexto.currentTime + 0.28,
      );

      oscilador.connect(volume);
      volume.connect(contexto.destination);
      oscilador.start();
      oscilador.stop(contexto.currentTime + 0.28);
    }

    tocarBipe();
    const intervalo = window.setInterval(tocarBipe, 700);
    return () => window.clearInterval(intervalo);
  }, [alarmeTocando]);

  // ------------------------------------------------------------------
  // Ações
  // ------------------------------------------------------------------

  function aplicarHorarioBrasilia() {
    const agora = obterHorarioBrasilia();
    setHorarioInicial(agora);
    setInicioRelogio({ horario: agora, instante: Date.now() });
    setErro("");
    setEditandoInicial(false);
  }

  function definirHorario() {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(horarioInicial)) {
      setErro("Escolha um horário inicial válido.");
      return;
    }

    setInicioRelogio({
      horario: horarioInicial,
      instante: Date.now(),
    });
    setErro("");
    setEditandoInicial(false);
  }

  async function ativarAlarme() {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(horarioAlarme)) {
      setMensagemAlarme("Escolha um horário de alarme válido.");
      return;
    }

    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    const agora = relogio?.horario ?? obterHorarioDecorrido(inicioRelogio);
    const [hA, mA, sA = 0] = agora.split(":").map(Number);
    const [hAl, mAl, sAl = 0] = horarioAlarme.split(":").map(Number);

    const segAgora = hA * 3600 + mA * 60 + sA;
    const segAlarme = hAl * 3600 + mAl * 60 + sAl;

    if (segAlarme <= segAgora) {
      setMensagemAlarme("Esse horário já passou — escolha um horário futuro.");
      return;
    }

    setAlarmeAtivo(true);
    setAlarmeTocando(false);
    setMensagemAlarme(`Alarme armado para ${horarioAlarme}.`);
    setEditandoAlarme(false);
  }

  function pararAlarme() {
    setAlarmeTocando(false);
    setAlarmeAtivo(false);
    setMensagemAlarme("Alarme desligado.");
  }

  // ------------------------------------------------------------------
  // Geometria do relógio
  // ------------------------------------------------------------------
  const centro = 180;
  const escala = 138;

  function calcularPonta(ponteiro: Ponteiro) {
    return {
      x: centro + ponteiro.x * escala,
      y: centro - ponteiro.y * escala,
    };
  }

  const marcacoes = Array.from({ length: 60 }, (_, i) => {
    const angulo = ((i * 6 - 90) * Math.PI) / 180;
    const raioExterno = 152;
    const raioInterno = i % 5 === 0 ? 140 : 146;

    return {
      x1: centro + Math.cos(angulo) * raioInterno,
      y1: centro + Math.sin(angulo) * raioInterno,
      x2: centro + Math.cos(angulo) * raioExterno,
      y2: centro + Math.sin(angulo) * raioExterno,
      principal: i % 5 === 0,
    };
  });

  const numeros = Array.from({ length: 12 }, (_, i) => {
    const numero = i === 0 ? 12 : i;
    const angulo = ((i * 30 - 90) * Math.PI) / 180;
    const raio = 118;

    return {
      numero,
      x: centro + Math.cos(angulo) * raio,
      y: centro + Math.sin(angulo) * raio,
    };
  });

  const pontaHoras = relogio ? calcularPonta(relogio.ponteiros.horas) : null;
  const pontaMinutos = relogio
    ? calcularPonta(relogio.ponteiros.minutos)
    : null;
  const pontaSegundos = relogio
    ? calcularPonta(relogio.ponteiros.segundos)
    : null;

  const horarioExibido = relogio?.horario ?? "--:--:--";
  const ponteiros = relogio?.ponteiros;

  return (
    <main className="pagina">
      <div className={`luz-lateral ${alarmeTocando ? "ativa" : ""}`} />

      <header className="cabecalho">
        <div className="cabecalho-esquerda">
          <span className="chapeu">FATEC JACAREÍ</span>
          <h1>Relógio Complexo</h1>
          <p>Números complexos representando ponteiros e operações.</p>
        </div>
      </header>

      <div className="divisor" />

      <section className="bloco-principal">
        <div className="mostrador">
          <svg
            className="relogio-svg"
            viewBox="0 0 360 360"
            role="img"
            aria-label="Relógio analógico"
          >
            <circle cx={centro} cy={centro} r="162" className="aro-externo" />
            <circle cx={centro} cy={centro} r="156" className="face" />

            {marcacoes.map((marca, i) => (
              <line
                key={i}
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
                x1={centro}
                y1={centro}
                x2={pontaHoras.x}
                y2={pontaHoras.y}
                className="ponteiro horas"
              />
            )}
            {pontaMinutos && (
              <line
                x1={centro}
                y1={centro}
                x2={pontaMinutos.x}
                y2={pontaMinutos.y}
                className="ponteiro minutos"
              />
            )}
            {pontaSegundos && (
              <line
                x1={centro}
                y1={centro}
                x2={pontaSegundos.x}
                y2={pontaSegundos.y}
                className="ponteiro segundos"
              />
            )}

            <circle cx={centro} cy={centro} r="6" className="eixo" />
          </svg>

          <div className="horario-abaixo">
            <span className="horario-grande">{horarioExibido}</span>
          </div>
        </div>

        <div className="controles">
          {/* Card 01 — Horário inicial */}
          <div className="card-controle">
            <span className="card-numero">01 / CONTROLE</span>
            <h3>Horário inicial</h3>

            {editandoInicial ? (
              <div className="editor">
                <input
                  type="time"
                  step="1"
                  value={horarioInicial}
                  onChange={(e) => setHorarioInicial(e.target.value)}
                />
                <button type="button" onClick={definirHorario}>
                  Aplicar
                </button>
              </div>
            ) : (
              <div className="valor-linha">
                <button
                  type="button"
                  className="valor-clicavel"
                  onClick={() => setEditandoInicial(true)}
                >
                  {horarioInicial}
                </button>
                <button
                  type="button"
                  className="botao-agora"
                  onClick={aplicarHorarioBrasilia}
                  title="Sincronizar com o horário atual de Brasília"
                >
                  Agora
                </button>
              </div>
            )}

            <p className="card-descricao">
              Começa no horário de Brasília. Clique no valor para editar.
            </p>
          </div>

          {/* Card 02 — Despertador */}
          <div className={`card-controle ${alarmeTocando ? "tocando" : ""}`}>
            <span className="card-numero">02 / DESPERTADOR</span>
            <h3>Alarme</h3>

            {editandoAlarme ? (
              <div className="editor">
                <input
                  type="time"
                  step="1"
                  value={horarioAlarme}
                  onChange={(e) => setHorarioAlarme(e.target.value)}
                />
                <button type="button" onClick={ativarAlarme}>
                  Armar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="valor-clicavel"
                onClick={() => setEditandoAlarme(true)}
              >
                {horarioAlarme}
              </button>
            )}

            {alarmeTocando ? (
              <button
                type="button"
                className="botao-parar"
                onClick={pararAlarme}
              >
                🔕 Desligar alarme
              </button>
            ) : (
              <p className="card-descricao">
                {mensagemAlarme ||
                  (alarmeAtivo
                    ? "⏳ Alarme armado. Aguardando o horário..."
                    : "Escolha um horário e clique em Armar.")}
              </p>
            )}
          </div>

          {erro && <div className="aviso-erro">{erro}</div>}
        </div>
      </section>

      {/* Laboratório matemático */}
      <section className="laboratorio">
        <div className="laboratorio-topo">
          <h2>Laboratório matemático</h2>
          <span className="selo-lab">ROTAÇÃO COMPLEXA</span>
        </div>

        <div className="laboratorio-grade">
          <div className="coluna">
            <span className="rotulo-pequeno">1 · PONTO INICIAL</span>
            <strong className="formula-grande">z₀ = i</strong>
            <span className="formula-desc">
              Todo ponteiro começa apontando para as 12h.
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
                const p = ponteiros[chave];

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
                        {formatarPonteiroComplexo(p)}
                      </span>
                    </div>

                    <div className="metricas">
                      <div className="linha-metrica">
                        <span className="rotulo">Ângulo θ</span>
                        <span className="valor">
                          {formatarNumero(p.angulo)}°
                        </span>
                      </div>

                      <div className="linha-metrica">
                        <span className="rotulo">θ em rad</span>
                        <span className="valor">
                          {formatarNumero((p.angulo * Math.PI) / 180)}
                        </span>
                      </div>

                      <div className="linha-metrica">
                        <span className="rotulo">Direção do vetor</span>
                        <span className="valor">
                          {formatarComplexo(p.rotacao)}
                        </span>
                      </div>

                      <div className="linha-metrica">
                        <span className="rotulo">Comprimento</span>
                        <span className="valor">
                          {formatarNumero(p.comprimento)}
                        </span>
                      </div>
                    </div>

                    <div className="calculo">
                      <span className="rotulo">CÁLCULO</span>
                      <span className="valor">
                        i × ({formatarComplexo(p.rotacao)}) ×{" "}
                        {formatarNumero(p.comprimento)}
                      </span>
                    </div>

                    <div className="coordenadas-caixa">
                      <div>
                        <span className="rotulo">RE (X)</span>
                        <span className="valor">{formatarNumero(p.x)}</span>
                      </div>
                      <div>
                        <span className="rotulo">IM (Y)</span>
                        <span className="valor">{formatarNumero(p.y)}</span>
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
    </main>
  );
}

export default App;
