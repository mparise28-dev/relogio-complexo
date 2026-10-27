type Props = {
  horarioInicial: string;
  horarioAlarme: string;
  mensagemAlarme: string;
  alarmeAtivo: boolean;
  alarmeTocando: boolean;
  erro: string;
  editandoInicial: boolean;
  editandoAlarme: boolean;
  onHorarioInicialChange: (horario: string) => void;
  onHorarioAlarmeChange: (horario: string) => void;
  onDefinirHorario: () => void;
  onAplicarHorarioBrasilia: () => void;
  onAtivarAlarme: () => void;
  onPararAlarme: () => void;
  onEditarInicial: () => void;
  onEditarAlarme: () => void;
};

export default function ControlesRelogio({
  horarioInicial,
  horarioAlarme,
  mensagemAlarme,
  alarmeAtivo,
  alarmeTocando,
  erro,
  editandoInicial,
  editandoAlarme,
  onHorarioInicialChange,
  onHorarioAlarmeChange,
  onDefinirHorario,
  onAplicarHorarioBrasilia,
  onAtivarAlarme,
  onPararAlarme,
  onEditarInicial,
  onEditarAlarme,
}: Props) {
  return (
    <div className="controles">
      <div className="card-controle">
        <span className="card-numero">01 / CONTROLE</span>
        <h3>Horário inicial</h3>

        {editandoInicial ? (
          <div className="editor">
            <input
              type="time"
              step="1"
              value={horarioInicial}
              onChange={(event) => onHorarioInicialChange(event.target.value)}
            />
            <button type="button" onClick={onDefinirHorario}>
              Aplicar
            </button>
          </div>
        ) : (
          <div className="valor-linha">
            <button
              type="button"
              className="valor-clicavel"
              onClick={onEditarInicial}
            >
              {horarioInicial}
            </button>
            <button
              type="button"
              className="botao-agora"
              onClick={onAplicarHorarioBrasilia}
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

      <div className={`card-controle ${alarmeTocando ? "tocando" : ""}`}>
        <span className="card-numero">02 / DESPERTADOR</span>
        <h3>Alarme</h3>

        {editandoAlarme ? (
          <div className="editor">
            <input
              type="time"
              step="1"
              value={horarioAlarme}
              onChange={(event) => onHorarioAlarmeChange(event.target.value)}
            />
            <button type="button" onClick={onAtivarAlarme}>
              Armar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="valor-clicavel"
            onClick={onEditarAlarme}
          >
            {horarioAlarme}
          </button>
        )}

        {alarmeTocando ? (
          <button type="button" className="botao-parar" onClick={onPararAlarme}>
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
  );
}