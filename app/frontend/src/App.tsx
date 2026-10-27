import { useEffect, useRef, useState } from "react";
import "./App.css";
import ControlesRelogio from "./components/ControlesRelogio";
import PainelMatematico from "./components/PainelMatematico";
import RelogioAnalogico from "./components/RelogioAnalogico";
import { API_URL } from "./services/api";
import type { DadosRelogio, InicioRelogio } from "./types";

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
    partes.find((parte) => parte.type === tipo)?.value ?? "00";

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
        if (falha instanceof DOMException && falha.name === "AbortError") {
          return;
        }
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

    setInicioRelogio({ horario: horarioInicial, instante: Date.now() });
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
    const [horaAtual, minutoAtual, segundoAtual = 0] = agora
      .split(":")
      .map(Number);
    const [horaAlarme, minutoAlarme, segundoAlarme = 0] = horarioAlarme
      .split(":")
      .map(Number);
    const segundosAgora =
      horaAtual * 3600 + minutoAtual * 60 + segundoAtual;
    const segundosAlarme =
      horaAlarme * 3600 + minutoAlarme * 60 + segundoAlarme;

    if (segundosAlarme <= segundosAgora) {
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
        <RelogioAnalogico relogio={relogio} />
        <ControlesRelogio
          horarioInicial={horarioInicial}
          horarioAlarme={horarioAlarme}
          mensagemAlarme={mensagemAlarme}
          alarmeAtivo={alarmeAtivo}
          alarmeTocando={alarmeTocando}
          erro={erro}
          editandoInicial={editandoInicial}
          editandoAlarme={editandoAlarme}
          onHorarioInicialChange={setHorarioInicial}
          onHorarioAlarmeChange={setHorarioAlarme}
          onDefinirHorario={definirHorario}
          onAplicarHorarioBrasilia={aplicarHorarioBrasilia}
          onAtivarAlarme={ativarAlarme}
          onPararAlarme={pararAlarme}
          onEditarInicial={() => setEditandoInicial(true)}
          onEditarAlarme={() => setEditandoAlarme(true)}
        />
      </section>

      <PainelMatematico ponteiros={relogio?.ponteiros} />
    </main>
  );
}

export default App;
