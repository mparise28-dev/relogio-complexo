# Frontend — Relógio Complexo

Interface em **React + TypeScript + Vite** que desenha um relógio analógico a partir dos cálculos devolvidos pela API Python. Inclui simulação de tempo, ajuste de hora inicial, sincronização com horário de Brasília e alarme com sinalização visual e sonora.

O frontend é servido em produção por um **Nginx dentro de um container Docker**, que também atua como **proxy reverso** para a API — eliminando completamente a necessidade de CORS.

---

## 📋 Sumário

- [Responsabilidade](#-responsabilidade)
- [Stack](#-stack)
- [Como rodar com Docker](#-como-rodar-com-docker)
- [Como rodar localmente](#-como-rodar-localmente)
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
| React | 19.x | UI declarativa |
| TypeScript | 6.x | Tipagem estática |
| Vite | 8.x | Build e dev server |
| oxlint | 1.x | Linter (rápido, escrito em Rust) |
| CSS puro | — | Estilização (sem framework) |
| Web Audio API | nativa | Bipe do alarme |
| Nginx | 1.31 (alpine) | Servidor de estáticos + proxy reverso |
| Node.js | 22+ (build) | Compila TypeScript + Vite |

---

## 🚀 Como rodar com Docker

**Recomendado.** O frontend sobe junto com o backend via `docker compose` na raiz do projeto.

### 1. Na raiz do projeto

```bash
docker compose up -d --build
```

### 2. Acessar

```
http://localhost:5173
```

O Nginx serve o `dist/` gerado pelo Vite e faz proxy de `/api/*` para `http://backend:8000` (nome do serviço na rede interna do Docker).

### Arquitetura do container

O `Dockerfile` do frontend usa **multi-stage build**:

**Estágio 1 — build (`node:22-alpine`):**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Estágio 2 — runtime (`nginx:alpine`):**
```dockerfile
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Resultado:** imagem final de **~25MB** — o Node inteiro fica no estágio descartado.

### Nginx como proxy reverso

O `nginx.conf` faz 3 coisas:

1. **Serve estáticos** — entrega `index.html`, JS, CSS e outros assets
2. **Proxy de `/api/*`** — encaminha pro backend (`http://backend:8000`) pela rede interna do Docker
3. **SPA fallback** — qualquer rota que não for arquivo cai no `index.html` (padrão pra SPAs)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Benefício:** o frontend só precisa saber que a API está em `/api` (URL relativa). Isso funciona em qualquer ambiente — Docker, dev local, produção.

### `.dockerignore`

Evita copiar `node_modules` e `dist` pro contexto de build:

```
node_modules/
dist/
.vite/
.env
.git/
```

---

## 🛠️ Como rodar localmente

Se preferir rodar sem Docker (durante desenvolvimento ativo, por exemplo):

### Pré-requisitos

- Node.js 18+
- Backend rodando em `http://127.0.0.1:8000`

### Instalação

```bash
cd app/frontend
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

> **Nota sobre a URL da API:** o frontend usa a URL relativa `/api`. No desenvolvimento com Vite, o proxy de `vite.config.ts` encaminha `/api/*` para `http://127.0.0.1:8000`; no Docker, o Nginx encaminha para `http://backend:8000`. Assim, a aplicação usa o mesmo caminho nos dois ambientes.

---

## 📜 Scripts

| Script | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` (roda `tsc -b && vite build`) |
| `npm run preview` | Preview local do build |
| `npm run lint` | oxlint em todo o código |

---

## 📁 Estrutura

```
app/frontend/
├── Dockerfile                          # Multi-stage: Node builda, Nginx serve
├── .dockerignore
├── nginx.conf                          # Proxy reverso + SPA fallback
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   └── relogio.svg
└── src/
    ├── App.tsx                         # Estado, efeitos e composição da tela
    ├── App.css                         # Estilos do app
    ├── index.css                       # Reset + variáveis de tema
    ├── main.tsx                        # Entry point do React
    ├── types.ts                        # Tipos compartilhados da resposta da API
    ├── components/
    │   ├── RelogioAnalogico.tsx        # Mostrador e ponteiros em SVG
    │   ├── ControlesRelogio.tsx        # Controles de horário e alarme
    │   └── PainelMatematico.tsx        # Laboratório matemático
    └── services/
        └── api.ts                      # URL base da API
```

### Por que essa estrutura?

- **`App.tsx`** — mantém estado, efeitos e ações de domínio da interface e conecta os componentes.
- **`components/`** — cada bloco visual principal fica em seu próprio arquivo, facilitando leitura e evolução.
- **`types.ts`** — define os tipos compartilhados usados pela resposta da API e seus componentes.
- **`services/api.ts`** — centraliza a URL base da API; o proxy de desenvolvimento fica configurado em `vite.config.ts`.

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

### URL base

A URL base da API fica em **`src/services/api.ts`**:

```ts
// Dev local (sem Docker): chama a API diretamente
// Com Docker: chama pelo proxy do Nginx (URL relativa)

export const API_URL = import.meta.env.VITE_API_URL ?? "";
```

Normalmente, a variável fica vazia e a aplicação usa `/api`. No dev local, o proxy do Vite encaminha essa rota para `http://127.0.0.1:8000`; no Docker, o Nginx encaminha para o serviço backend. `VITE_API_URL` pode ser definida em `.env.local` para apontar diretamente a outro endereço de API.

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
- **Nomes de função em português** para ações de domínio (`definirHorario`, `ativarAlarme`).
- **Nomes de componentes em PascalCase** (`RelogioAnalogico`, `PainelMatematico`).
- **Nomes de arquivos de componente em PascalCase** — casa com o nome do componente.
- **Nomes de arquivos utilitários em camelCase** (`api.ts`).