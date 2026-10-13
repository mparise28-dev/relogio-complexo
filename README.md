# Relógio Complexo 🔵🕐

> Sistema de relógio analógico que representa **ponteiros como números complexos** no plano de Argand-Gauss, com simulação de tempo, ajuste de hora inicial, sincronização com horário de Brasília e alarme com sinalização visual e sonora.

Projeto desenvolvido para a disciplina de **Matemática para Computação** — FATEC Jacareí, curso de Desenvolvimento de Software Multiplataforma.

---

## 📋 Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Demonstração](#-demonstração)
- [Arquitetura](#-arquitetura)
- [Stack técnica](#-stack-técnica)
- [Como rodar](#-como-rodar)
- [Endpoints da API](#-endpoints-da-api)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Decisões de projeto](#-decisões-de-projeto)
- [Roadmap](#-roadmap)
- [Equipe](#-equipe)

---

## 📖 Sobre o projeto

O **Relógio Complexo** resolve o clássico problema de representar um relógio analógico usando **números complexos**. Em vez de calcular ângulos e projetar em coordenadas cartesianas manualmente, o sistema:

1. Parte do ponto inicial `z₀ = i` (todo ponteiro começa apontando para as 12h);
2. Aplica o **fator de rotação** `cos θ + i·sen θ` (fórmula de Euler);
3. Multiplica pelo comprimento do ponteiro, obtendo `z = x + yi`;
4. Usa as partes real (`x`) e imaginária (`y`) para desenhar a ponta do ponteiro no mostrador.

O sistema é dividido em **duas camadas**:

- **Backend (Python + FastAPI)** — responsável pelos cálculos matemáticos e pela API REST.
- **Frontend (React + TypeScript + Vite)** — responsável pela interface, simulação de tempo, alarme e visualização.

### Funcionalidades entregues

- ✅ Exibição de **horas**, **minutos** e **segundos** como ponteiros analógicos
- ✅ **Ajuste de hora inicial** (simulação a partir de qualquer horário)
- ✅ **Sincronização com horário de Brasília** (`America/Sao_Paulo`)
- ✅ **Alarme** com horário configurável
- ✅ **Luz lateral piscante** e **sinal sonoro** ao disparar o alarme
- ✅ **Laboratório matemático** exibindo em tempo real: ângulo, direção do vetor unitário, comprimento, coordenadas e o cálculo completo

---

## 🎬 Demonstração

![Demonstração do relógio](docs/demo.gif)

> O relógio atualiza a cada segundo consumindo a API. Ao disparar o alarme, uma barra vermelha pisca na lateral esquerda e um bipe soa até o usuário clicar em "Desligar alarme".

---

## 🏗️ Arquitetura

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│         FRONTEND            │         │          BACKEND            │
│                             │         │                             │
│  React + TypeScript + Vite  │  HTTP   │   Python + FastAPI          │
│                             │ ──────► │                             │
│  • Desenha o relógio (SVG)  │  JSON   │   • Calcula ângulos         │
│  • Simula o tempo           │         │   • Gera número complexo    │
│  • Controla o alarme        │         │   • Calcula coordenadas     │
│  • Consome /api/relogio     │         │   • Expõe API REST          │
└─────────────────────────────┘         └─────────────────────────────┘
         localhost:5173                         127.0.0.1:8000
```

### Fluxo de dados

1. O frontend mantém o **estado do relógio simulado** (`HH:MM:SS`).
2. A cada 1s, o frontend chama `GET /api/relogio?horario=...`.
3. O backend calcula os três ângulos e devolve, para cada ponteiro:
   - `angulo` em graus
   - `rotacao` — vetor unitário `cos θ + i·sen θ`
   - `comprimento`
   - `x` e `y` — coordenadas cartesianas
4. O frontend desenha cada ponteiro como uma linha SVG entre `(centro, centro)` e `(x, y)` convertidos para a escala do SVG.
5. A cada 400ms, o frontend compara o horário atual com o horário do alarme. Se bater, dispara luz + som.

---

## 🧰 Stack técnica

| Camada          | Tecnologias                              |
| --------------- | ---------------------------------------- |
| **Backend**     | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| **Frontend**    | React 18, TypeScript, Vite               |
| **Ferramentas** | ESLint, Prettier                         |
| **Ambiente**    | Node.js 18+, npm                         |

### Por que essas escolhas?

- **FastAPI** — tipagem nativa com Pydantic, docs automáticas (`/docs`), async e leve.
- **Vite** — build rápido e HMR instantâneo, ideal pra dev local.
- **TypeScript** — o contrato da API fica tipado no front, evitando bugs de integração.
- **SVG para o relógio** — escalável, animável via CSS, sem dependência de canvas.

---

## 🚀 Como rodar

### Pré-requisitos

- **Python 3.11+**
- **Node.js 18+**
- **npm**

### 1. Clonar o repositório

```bash
git clone https://github.com/mparise28-dev/relogio-complexo.git
cd relogio-complexo
```

### 2. Rodar o backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

A API estará em `http://127.0.0.1:8000`. Documentação interativa em `http://127.0.0.1:8000/docs`.

### 3. Rodar o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O app estará em `http://localhost:5173`.

### 4. Testar

Abra `http://localhost:5173`, o relógio deve começar no **horário atual de Brasília**.

- Clique no horário inicial → digite outro → **Aplicar** para simular.
- Clique em **Agora** para voltar ao horário real.
- Configure o alarme para 10s à frente → **Armar** → espere → luz lateral + bipe tocam.

---

## 🔌 Endpoints da API

### `GET /`

Verifica se a API está no ar.

**Resposta:**

```json
{ "mensagem": "API do relógio funcionando!" }
```

### `GET /api/relogio?horario=HH:MM:SS`

Calcula a posição dos três ponteiros para o horário informado.

**Parâmetros:**
| Nome | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `horario` | string | Não | `10:10:30` | Horário no formato `HH:MM:SS` |

**Resposta (200):**

```json
{
  "horario": "10:10:30",
  "ponteiros": {
    "horas": {
      "angulo": 305.8083,
      "rotacao": { "real": 0.5824, "imaginaria": -0.8129 },
      "multiplicacao": { "real": 0.8129, "imaginaria": 0.5824 },
      "comprimento": 0.55,
      "x": 0.3203,
      "y": -0.4471
    },
    "minutos": { "...": "mesmo shape" },
    "segundos": { "...": "mesmo shape" }
  }
}
```

**Erros:**
| Status | Quando |
|---|---|
| `400` | Horário em formato inválido (não é `HH:MM:SS`) |

---

## 📁 Estrutura de pastas

```
relogio-complexo/
├── backend/
│   ├── README.md
│   ├── api.py                          # Rotas FastAPI
│   ├── matematica.py                   # Cálculos (ângulos, rotação complexa)
│   ├── alarme.py                       # Classe de domínio do alarme
│   ├── relogio.py                      # Utilitários do relógio
│   ├── demonstracao_com_matplotlib.py  # Demo standalone
│   ├── testes_alarme.py
│   ├── testes_matematica.py
│   └── requirements.txt
│
├── frontend/
│   ├── README.md
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   └── demo.gif
│
├── .gitignore
└── README.md
```

---

## 🧠 Decisões de projeto

### Por que o cálculo está no backend e não no front?

A ideia é **separar domínio de apresentação**. Os números complexos são a **regra de negócio** do projeto — quem sabe calcular `z = c·(cos θ + i·sen θ)` é o Python. O React só **consome e desenha**. Isso deixa o código mais testável e permite reutilizar o mesmo cálculo em outros clientes (CLI, mobile, etc.).

### Por que o alarme é controlado no frontend?

O backend tem sua própria noção de tempo (`datetime.now()`), que **não bate** com o horário simulado do frontend. Se o backend controlasse o alarme, ele nunca dispararia — porque o relógio "real" dele é diferente do relógio simulado na tela. Optou-se por manter o alarme no frontend, comparando o `horario` simulado com o horário configurado.

### Por que `Intl.DateTimeFormat` e não `Date` direto?

`Date` usa o **timezone da máquina do usuário**, que pode estar configurada errada. Com `Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" })`, o horário é sempre o de Brasília, independente da máquina.

### Por que `multiplicacao` está na resposta?

O backend também devolve `i · rotacao`, que é a **mesma direção girada 90°**. É uma operação matemática interessante do ponto de vista didático, mas **não é usada pelo frontend** para desenhar o ponteiro — o ponteiro é obtido apenas com `rotacao × comprimento`.

---

## 🗺️ Roadmap

- [x] Cálculo de ângulos e coordenadas via API
- [x] Desenho analógico com números complexos
- [x] Ajuste de hora inicial
- [x] Sincronização com horário de Brasília
- [x] Alarme com luz e som
- [x] Laboratório matemático exibindo a operação
- [ ] Testes automatizados no frontend (Vitest + Testing Library)
- [ ] Deploy público (Vercel + Render)
- [ ] Suporte a múltiplos fusos horários
- [ ] Internacionalização (pt-BR / en-US)

---

## 👥 Equipe

| Nome                                 | Responsabilidade                                             |
| ------------------------------------ | ------------------------------------------------------------ |
| **Marcello Parise Campbell Fonseca** | Frontend - Backend (React + TypeScript e Python + FastAPI), integração com API            |
| **Gustavo Koiti Yoshimura**          | Backend (Python + FastAPI), matemática dos números complexos |

**Instituição:** FATEC Jacareí — Desenvolvimento de Software Multiplataforma
**Disciplina:** Matemática para Computação
**Professor:** Fabrício Galende Marques de Carvalho

---

## 📄 Licença

Projeto acadêmico, sem fins comerciais.
