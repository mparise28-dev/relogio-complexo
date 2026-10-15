# Relógio Complexo 🔵🕐

> Sistema de relógio analógico que representa **ponteiros como números complexos** no plano de Argand-Gauss, com simulação de tempo, ajuste de hora inicial, sincronização com horário de Brasília e alarme com sinalização visual e sonora.

Projeto desenvolvido para a disciplina de **Matemática para Computação** — FATEC Jacareí, curso de Desenvolvimento de Software Multiplataforma.

---

## 📋 Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Arquitetura](#-arquitetura)
- [Stack técnica](#-stack-técnica)
- [Como rodar com Docker](#-como-rodar-com-docker-recomendado)
- [Como rodar localmente](#-como-rodar-localmente-sem-docker)
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

O sistema é orquestrado com **Docker Compose**, que sobe dois containers — backend e frontend — em uma rede interna privada.

```
┌────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR                              │
│                                                                │
│                  http://localhost:5173                         │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     CONTAINER: frontend                        │
│                                                                │
│   Nginx (porta 80 dentro do container)                         │
│   ├── /              → serve o dist/ do Vite                   │
│   └── /api/*         → faz proxy pro backend                   │
│                                                                │
│   Porta exposta no host: 5173                                  │
└───────────────────────────┬────────────────────────────────────┘
                            │ (rede interna do Docker)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                     CONTAINER: backend                         │
│                                                                │
│   Uvicorn em 0.0.0.0:8000                                      │
│   └── /api/relogio, /api/alarme, etc.                          │
│                                                                │
│   Porta exposta no host: 8000 (opcional, pra debug)            │
└────────────────────────────────────────────────────────────────┘
```

**Pontos-chave dessa arquitetura:**

- **Zero CORS** — o navegador só fala com o frontend. O Nginx faz o proxy reverso pra `/api/*` internamente, então tudo é mesma origem.
- **Frontend chama `/api/...`** (URL relativa, sem host) — funciona em qualquer ambiente: Docker, dev local, produção.
- **Backend não precisa expor porta** — o Nginx fala com ele pela rede interna do Docker, usando o nome do serviço (`http://backend:8000`). A porta 8000 no host é só pra debug (permite acessar `http://localhost:8000/docs`).
- **Imagem do frontend minúscula** — o build do Vite roda em um estágio com Node, mas a imagem final só tem Nginx + arquivos estáticos (~25MB).

### Fluxo de dados

1. O frontend mantém o **estado do relógio simulado** (`HH:MM:SS`).
2. A cada 1s, o frontend chama `GET /api/relogio?horario=...`.
3. O Nginx recebe a chamada em `http://localhost:5173/api/relogio` e faz proxy pra `http://backend:8000/api/relogio`.
4. O backend calcula os três ângulos e devolve, para cada ponteiro:
   - `angulo` em graus
   - `rotacao` — vetor unitário `cos θ + i·sen θ`
   - `comprimento`
   - `x` e `y` — coordenadas cartesianas
5. O frontend desenha cada ponteiro como uma linha SVG entre `(centro, centro)` e `(x, y)` convertidos para a escala do SVG.
6. A cada 400ms, o frontend compara o horário atual com o horário do alarme. Se bater, dispara luz + som.

---

## 🧰 Stack técnica

| Camada | Tecnologias |
| --- | --- |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| **Frontend** | React 19, TypeScript, Vite, oxlint |
| **DevOps** | Docker, Docker Compose, Nginx (proxy reverso) |
| **Ambiente** | Node.js 22+, npm, Docker Desktop |

### Por que essas escolhas?

- **FastAPI** — tipagem nativa com Pydantic, docs automáticas (`/docs`), async e leve.
- **Vite** — build rápido e HMR instantâneo, ideal pra dev local.
- **TypeScript** — o contrato da API fica tipado no front, evitando bugs de integração.
- **SVG para o relógio** — escalável, animável via CSS, sem dependência de canvas.
- **Docker + Docker Compose** — build reproduzível e portável. Um único comando (`docker compose up`) sobe o sistema inteiro em qualquer máquina com Docker instalado.
- **Nginx como proxy reverso** — elimina CORS, simplifica a configuração do frontend e é o padrão de mercado para servir SPAs em produção.

---

## 🚀 Como rodar com Docker (recomendado)

Essa é a forma **mais simples** e **mais portável** de rodar o projeto. Funciona em qualquer máquina com Docker instalado.

### Pré-requisitos

- **Docker Desktop** (Windows, macOS) ou **Docker Engine + Compose** (Linux)

### 1. Clonar o repositório

```bash
git clone https://github.com/mparise28-dev/relogio-complexo.git
cd relogio-complexo
```

### 2. Subir os containers

```bash
docker compose up -d --build
```

O `--build` garante que as imagens sejam construídas na primeira execução. Nas próximas vezes, se você não mudou código, pode rodar só `docker compose up -d`.

### 3. Acessar

- **App:** `http://localhost:5173`
- **API (debug):** `http://localhost:8000/docs`

### 4. Parar

```bash
docker compose down
```

### Comandos úteis

```bash
# Ver os containers rodando
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs só do backend
docker compose logs -f backend

# Rebuildar após mudança de código
docker compose up -d --build

# Limpar tudo (containers, imagens, volumes)
docker compose down --volumes --rmi all
```

### 5. Testar o app

Abra `http://localhost:5173`. O relógio deve começar no **horário atual de Brasília**.

- Clique no horário inicial → digite outro → **Aplicar** para simular.
- Clique em **Agora** para voltar ao horário real.
- Configure o alarme para 10s à frente → **Armar** → espere → luz lateral + bipe tocam.

---

## 🛠️ Como rodar localmente (sem Docker)

Se preferir rodar sem Docker (por exemplo, durante o desenvolvimento ativo), você precisa subir o backend e o frontend em terminais separados.

### Pré-requisitos

- **Python 3.11+**
- **Node.js 18+**
- **npm**

### 1. Backend

```bash
cd app/backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

A API estará em `http://127.0.0.1:8000`. Documentação interativa em `http://127.0.0.1:8000/docs`.

### 2. Frontend

Em outro terminal:

```bash
cd app/frontend
npm install
npm run dev
```

O app estará em `http://localhost:5173`.

> **Nota:** rodando sem Docker, o frontend chama a API em `http://127.0.0.1:8000` diretamente, e o CORS do backend está configurado para aceitar essa origem. Rodando com Docker, o Nginx faz o proxy e o CORS deixa de ser necessário.

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
| --- | --- | --- | --- | --- |
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
| --- | --- |
| `400` | Horário em formato inválido (não é `HH:MM:SS`) |

---

## 📁 Estrutura de pastas

```
relogio-complexo/
├── docker-compose.yml                  # Orquestra os containers
├── .dockerignore
├── .gitignore
├── README.md
│
└── app/
    ├── backend/
    │   ├── Dockerfile
    │   ├── .dockerignore
    │   ├── requirements.txt
    │   ├── README.md
    │   ├── api.py                          # Rotas FastAPI
    │   ├── matematica.py                   # Cálculos (ângulos, rotação complexa)
    │   ├── alarme.py                       # Classe de domínio do alarme
    │   ├── relogio.py                      # Utilitários do relógio
    │   ├── demonstracao_complexos.py       # Demo standalone (matplotlib)
    │   └── testes_*.py
    │
    └── frontend/
        ├── Dockerfile
        ├── .dockerignore
        ├── nginx.conf                      # Proxy reverso + SPA fallback
        ├── README.md
        ├── package.json
        ├── tsconfig.json
        ├── vite.config.ts
        ├── index.html
        ├── public/
        └── src/
            ├── App.tsx
            ├── App.css
            ├── index.css
            ├── main.tsx
            ├── components/
            │   ├── Alarme.tsx
            │   ├── PainelMatematico.tsx
            │   ├── PlanoComplexo.tsx
            │   └── RelogioAnalogico.tsx
            └── services/
                └── api.ts                  # URL base da API
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

### Por que Nginx fazendo proxy em vez de CORS?

Com Nginx proxy reverso, o navegador só conversa com **uma origem** (`http://localhost:5173`). O Nginx recebe requisições em `/api/*` e encaminha internamente para o backend. Resultado:

- **Zero CORS** — não há origem cruzada pra configurar
- **Frontend portável** — a URL da API é relativa (`/api`), funciona em qualquer ambiente
- **Padrão de mercado** — é como empresas servem SPAs em produção

### Por que multi-stage build no frontend?

A imagem do frontend tem **dois estágios**:

1. **Estágio de build** (`node:22-alpine`) — instala dependências e roda `npm run build` (que executa `tsc -b && vite build`)
2. **Estágio final** (`nginx:alpine`) — copia só a pasta `dist/` gerada no estágio 1

Isso reduz o tamanho final de **~500MB** (se usasse só Node) para **~25MB** (Nginx + estáticos). O Node inteiro fica no estágio descartado.

---

## 🗺️ Roadmap

- [x] Cálculo de ângulos e coordenadas via API
- [x] Desenho analógico com números complexos
- [x] Ajuste de hora inicial
- [x] Sincronização com horário de Brasília
- [x] Alarme com luz e som
- [x] Laboratório matemático exibindo a operação
- [x] **Dockerização completa** (backend, frontend, compose)
- [x] **Nginx como proxy reverso e servidor de estáticos**
- [ ] Testes automatizados no frontend (Vitest + Testing Library)
- [ ] Deploy público (Vercel + Render)
- [ ] Suporte a múltiplos fusos horários
- [ ] Internacionalização (pt-BR / en-US)

---

## 👥 Equipe

| Nome | Responsabilidade |
| --- | --- |
| **Marcello Parise Campbell Fonseca** | Frontend e Backend (React + TypeScript e Python + FastAPI), integração com API, Docker |
| **Gustavo Koiti Yoshimura** | Backend (Python + FastAPI), matemática dos números complexos |

**Instituição:** FATEC Jacareí — Desenvolvimento de Software Multiplataforma
**Disciplina:** Matemática para Computação
**Professor:** Fabrício Galende Marques de Carvalho

---

## 📄 Licença

Projeto acadêmico, sem fins comerciais.