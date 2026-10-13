# Frontend — Relógio Complexo

Interface em **React + TypeScript + Vite** que desenha um relógio analógico a partir dos cálculos devolvidos pela API Python. Inclui simulação de tempo, ajuste de hora inicial, sincronização com horário de Brasília e alarme com sinalização visual e sonora.

---

## 📋 Sumário

- [Responsabilidade](#-responsabilidade)
- [Stack](#-stack)
- [Como rodar](#-como-rodar)
- [Scripts](#-scripts)
- [Estrutura](#-estrutura)
- [Arquitetura de estado](#-arquitetura-de-estado)
- [Integração com a API](#-integração-com-a-api)
- [Alarme](#-alarme)
- [Convenções](#-convenções)

---

## 🎯 Responsabilidade

O frontend **não calcula matemática complexa**. Ele:

1. Mantém o **estado do relógio simulado** (`HH:MM:SS`)
2. Consulta a API a cada segundo
3. Desenha os ponteiros em SVG usando `x` e `y` retornados
4. Compara o horário atual com o do alarme e dispara som + luz
5. Exibe um **laboratório matemático** com os números complexos por trás dos ponteiros

---

## 🧰 Stack

| Item | Versão | Papel |
|---|---|---|
| React | 18.x | UI declarativa |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build e dev server |
| CSS puro | — | Estilização (sem framework) |
| Web Audio API | nativa | Bipe do alarme |

---

## 🚀 Como rodar

### Pré-requisitos

- Node.js 18+
- Backend rodando em `http://127.0.0.1:8000`

### Instalação

```bash
npm install
```

### Dev server

```bash
npm run dev
```

Abre em `http://localhost:5173`.

### Build de produção

```bash
npm run build
npm run preview
```

---

## 📜 Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Preview local do build |
| `npm run lint` | ESLint em todo o código |

---

## 📁 Estrutura

```
frontend/
├── public/
├── src/
│   ├── App.tsx        # Componente principal (tudo vive aqui)
│   ├── App.css        # Estilos globais do app
│   ├── index.css      # Reset + variáveis de tema (CSS custom properties)
│   └── main.tsx       # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

O projeto **intencionalmente não tem roteamento nem múltiplas páginas** — é uma aplicação de uma tela só. Por isso, `App.tsx` concentra tudo. Se crescer, o próximo passo é quebrar em:

```
src/
├── components/
│   ├── Mostrador.tsx       # SVG do relógio
│   ├── CardControle.tsx    # Card 01 (horário inicial)
│   ├── CardAlarme.tsx      # Card 02 (alarme)
│   ├── Laboratorio.tsx     # Laboratório matemático
│   └── LuzLateral.tsx      # Faixa vermelha piscante
├── hooks/
│   ├── useRelogio.ts       # Fetch + polling da API
│   ├── useAlarme.ts        # Estado + som do alarme
│   └── useHorarioBrasilia.ts
├── types/
│   └── api.ts              # Tipos da resposta da API
└── App.tsx
```

---

## 🧠 Arquitetura de estado

O `App.tsx` mantém os seguintes estados:

| Estado | Tipo | Papel |
|---|---|---|
| `relogio` | `DadosRelogio \| null` | Resposta atual da API (ponteiros) |
| `erro` | `string` | Mensagem de erro de conexão/validação |
| `horarioInicial` | `string` | Valor exibido no Card 01 |
| `horarioAlarme` | `string` | Valor exibido no Card 02 |
| `mensagemAlarme` | `string` | Feedback do alarme |
| `alarmeAtivo` | `boolean` | Alarme armado (aguardando horário) |
| `alarmeTocando` | `boolean` | Alarme disparou, luz + som ligados |
| `inicioRelogio` | `InicioRelogio` | Âncora da simulação (`horario` + `instante`) |
| `editandoInicial` | `boolean` | Card 01 em modo edição |
| `editandoAlarme` | `boolean` | Card 02 em modo edição |

Mais uma ref:

| Ref | Tipo | Papel |
|---|---|---|
| `audioContextRef` | `AudioContext \| null` | Contexto de áudio do alarme |

### Como o tempo anda

O relógio **não** avança com `setInterval` somando segundos. Ele é **derivado**:

```
horario_exibido = inicioRelogio.horario + (Date.now() - inicioRelogio.instante)
```

Isso evita drift e problemas com a aba em background. Pra mudar o horário, basta trocar `inicioRelogio`.

### Fluxo de dados

```
┌──────────────────────────────────────────────────────────────┐
│  useEffect #1 — a cada 1s                                    │
│  ─────────────────────────────────────────────────────────    │
│  1. horario = obterHorarioDecorrido(inicioRelogio)           │
│  2. fetch(`${API_URL}/api/relogio?horario=${horario}`)       │
│  3. setRelogio(dados)                                        │
│     (com AbortController pra cancelar requisições antigas)   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  useEffect #2 — a cada 400ms enquanto alarmeAtivo            │
│  ─────────────────────────────────────────────────────────    │
│  1. agora = relogio.horario ?? obterHorarioDecorrido(...)    │
│  2. if (agora === horarioAlarme) setAlarmeTocando(true)      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  useEffect #3 — enquanto alarmeTocando                       │
│  ─────────────────────────────────────────────────────────    │
│  1. Cria OscillatorNode (880 Hz, 0.28s)                      │
│  2. Repete a cada 700ms                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes e classes

### SVG do relógio

Constantes do mostrador:

```ts
const centro = 180;   // coordenada do centro no viewBox
const escala = 138;   // fator para converter unidade do backend → pixel SVG

function calcularPonta(p: Ponteiro) {
  return {
    x: centro + p.x * escala,
    y: centro - p.y * escala,   // y invertido: SVG cresce pra baixo
  };
}
```

### Marcadores e números

Gerados programaticamente:

- **60 marcas** (uma por minuto). As de 5 em 5 (hora cheia) são mais grossas → `.marca.principal`
- **12 números** posicionados a `118` unidades do centro

### Classes CSS importantes

| Classe | Uso |
|---|---|
| `.ponteiro.horas` | Ponteiro das horas (grosso, escuro) |
| `.ponteiro.minutos` | Ponteiro dos minutos |
| `.ponteiro.segundos` | Ponteiro dos segundos (fino, laranja) |
| `.destaque-z` | Bloco verde com o `z` do ponteiro |
| `.linha-metrica` | Linha de métrica (label à esquerda, valor à direita) |
| `.coordenadas-caixa` | Caixa âmbar com Re(x) e Im(y) |
| `.calculo` | Bloco tracejado com a operação completa |
| `.luz-lateral.ativa` | Faixa vermelha piscando quando o alarme toca |

---

## 🔌 Integração com a API

### Tipos (espelham o backend)

```ts
type NumeroComplexo = { real: number; imaginaria: number };

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
```

### Fetch com cancelamento

```ts
const controller = new AbortController();

try {
  const resposta = await fetch(url, { signal: controller.signal });
  ...
} catch (falha) {
  if (falha instanceof DOMException && falha.name === "AbortError") return;
  // erro real
}
```

O `AbortController` **cancela a requisição anterior** se uma nova for disparada antes da anterior terminar. Isso evita que respostas atrasadas sobrescrevam as atuais.

### Variáveis de ambiente (recomendado)

Atualmente a URL está hardcoded:

```ts
const API_URL = "http://127.0.0.1:8000";
```

Pra produção, o ideal é:

```ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
```

E no `.env.local`:
```
VITE_API_URL=https://api.seusite.com
```

---

## 🔔 Alarme

O alarme **não passa pelo backend**. Isso é intencional: o backend usa `datetime.now()` (tempo real), e o front simula um tempo próprio. Como os dois nunca batem, o alarme é resolvido 100% no front.

### Como funciona

1. Usuário digita `HH:MM:SS` no Card 02 e clica em **Armar**
2. `ativarAlarme()` valida o formato, cria o `AudioContext` (dentro do clique do usuário, obrigatório em navegadores modernos), e checa se o horário ainda está no futuro
3. `alarmeAtivo = true`. A cada 400ms, um `setInterval` compara `relogio.horario === horarioAlarme`
4. Quando bate: `alarmeTocando = true` → luz lateral `.ativa` + `setInterval` de bipe (880 Hz, 0.28s a cada 700ms)
5. Usuário clica em **Desligar alarme** → para o som e desliga a luz

### Por que o `AudioContext` é criado no clique

Navegadores modernos bloqueiam autoplay de áudio. Se o `AudioContext` for criado sem gesto do usuário, ele inicia em estado `suspended` e nunca toca. Ao criar dentro do `onClick` de "Armar", o navegador confia no contexto e permite reprodução.

### Horário de Brasília

```ts
new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
}).formatToParts(new Date());
```

Usamos `Intl` em vez de `new Date().toLocaleTimeString()` porque queremos **forçar o fuso de Brasília**, independente da máquina do usuário.

---

## 📏 Convenções

- **Nomes de estado em português** (`horarioInicial`, `alarmeTocando`) — alinhados com o domínio do projeto.
- **Nomes de função em português** para ações de domínio (`definirHorario`, `ativar