# Backend — Relógio Complexo

API REST em **Python + FastAPI** responsável pelos cálculos matemáticos que posicionam os ponteiros do relógio como números complexos no plano de Argand-Gauss.

---

## 📋 Sumário

- [Responsabilidade](#-responsabilidade)
- [Stack](#-stack)
- [Como rodar com Docker](#-como-rodar-com-docker)
- [Como rodar localmente](#-como-rodar-localmente)
- [Endpoints](#-endpoints)
- [Modelo matemático](#-modelo-matemático)
- [Estrutura de arquivos](#-estrutura-de-arquivos)
- [Testes](#-testes)
- [Convenções](#-convenções)
- [Referências](#-referências)

---

## 🎯 Responsabilidade

O backend **não sabe o que é um relógio analógico nem o que é um alarme com luz**. Ele apenas:

1. Recebe um horário no formato `HH:MM:SS`
2. Calcula os ângulos de cada ponteiro
3. Transforma cada ângulo em um número complexo no plano
4. Devolve os dados em JSON para qualquer cliente consumir

Essa separação permite que o mesmo backend sirva um app React, um CLI, um mobile, etc.

---

## 🧰 Stack

| Item | Versão | Papel |
|---|---|---|
| Python | 3.11+ | Linguagem |
| FastAPI | 0.143+ | Framework HTTP |
| Uvicorn | 0.54+ | ASGI server |
| Pydantic | 2.14+ | Validação de schemas |
| python-dotenv | 1.2+ | Leitura de `.env` |
| pytest | 8.x | Testes (dev) |
| Docker | 24+ | Empacotamento da imagem |

### Dependências instaladas

O `requirements.txt` é **propositalmente enxuto** — contém só o que a API precisa pra rodar em produção:

```
fastapi==0.143.0
uvicorn[standard]==0.54.0
pydantic==2.14.0
python-dotenv==1.2.4
```

Libs usadas em scripts auxiliares (matplotlib, numpy, jupyter) **não entram** aqui. Elas são ferramentas de desenvolvimento/análise e não têm relação com o runtime da API. Se um dia forem necessárias dentro do container, criamos um `requirements-dev.txt` separado.

---

## 🚀 Como rodar com Docker

**Recomendado.** O container do backend roda em conjunto com o do frontend via `docker compose` na raiz do projeto.

### 1. Na raiz do projeto

```bash
docker compose up -d --build
```

Isso constrói a imagem do backend (`python:3.11-slim`) e sobe o container.

### 2. Acessar

- **API (debug direto):** `http://localhost:8000/docs`
- **Via proxy do frontend:** `http://localhost:5173/api/relogio`

### Detalhes da imagem

O `Dockerfile` do backend:

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Pontos-chave:**

- **`python:3.11-slim`** — imagem base leve (~120MB) em vez da completa (~900MB)
- **`PYTHONUNBUFFERED=1`** — logs saem no `stdout` imediatamente, sem buffer. Essencial pra ver os logs do uvicorn em tempo real via `docker compose logs`
- **`PYTHONDONTWRITEBYTECODE=1`** — não gera `.pyc` (o container é efêmero, não faz sentido)
- **`COPY requirements.txt` primeiro, depois `COPY . .`** — aproveita o cache de camadas. Se você mudar só o código Python, o `pip install` não roda de novo
- **`--host 0.0.0.0`** — **obrigatório** dentro do Docker. `127.0.0.1` faz o container recusar conexões externas, e o Nginx do frontend não consegue falar com ele
- **`--no-cache-dir`** no pip — não guarda cache de download na imagem

### `.dockerignore`

Evita copiar lixo pro build:

```
__pycache__/
*.pyc
.venv/
.env
*.md
.git/
notebooks/
```

---

## 🛠️ Como rodar localmente

Se preferir rodar sem Docker (durante desenvolvimento ativo, por exemplo):

### Ambiente virtual

```bash
cd app/backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Servidor de desenvolvimento

```bash
uvicorn api:app --reload --host 127.0.0.1 --port 8000
```

| URL | O que é |
|---|---|
| `http://127.0.0.1:8000/` | Health check |
| `http://127.0.0.1:8000/docs` | Swagger UI (docs interativas) |
| `http://127.0.0.1:8000/redoc` | ReDoc (docs alternativas) |

> **Nota sobre CORS:** rodando localmente, o frontend (em `localhost:5173` ou `127.0.0.1:5173`) chama a API direto, e o CORS do FastAPI precisa estar configurado pra aceitar essas origens. Rodando com Docker, o Nginx faz proxy reverso e o CORS deixa de ser necessário.

---

## 🔌 Endpoints

### `GET /` — Health check

```http
GET /
```

**200 OK:**
```json
{ "mensagem": "API do relógio funcionando!" }
```

---

### `GET /api/relogio` — Calcular ponteiros

```http
GET /api/relogio?horario=10:10:30
```

**Query params:**

| Nome | Tipo | Padrão | Descrição |
|---|---|---|---|
| `horario` | string | `10:10:30` | Horário no formato `HH:MM:SS` (24h) |

**200 OK:**
```json
{
  "horario": "10:10:30",
  "ponteiros": {
    "horas": {
      "angulo": 305.8083,
      "rotacao":      { "real":  0.5824, "imaginaria": -0.8129 },
      "multiplicacao":{ "real":  0.8129, "imaginaria":  0.5824 },
      "comprimento": 0.55,
      "x":  0.3203,
      "y": -0.4471
    },
    "minutos": { "...": "mesmo shape" },
    "segundos":{ "...": "mesmo shape" }
  }
}
```

**400 Bad Request** — quando o horário não está em `HH:MM:SS`:
```json
{ "detail": "Horário inválido. Use HH:MM:SS." }
```

---

### `POST /api/alarme` — Configurar alarme

> ⚠️ **Não utilizado pelo frontend atual.** O alarme está implementado 100% no front, porque o backend usa `datetime.now()` (tempo real) e o frontend simula um horário próprio. Este endpoint fica disponível para clientes que operem em tempo real.

```http
POST /api/alarme
Content-Type: application/json

{ "horario": "10:10:40" }
```

**200 OK:**
```json
{ "mensagem": "Alarme configurado com sucesso.", "horario": "10:10:40", "tocando": false }
```

---

### `GET /api/alarme` — Consultar estado do alarme

> ⚠️ **Não utilizado pelo frontend atual.** Mesma justificativa acima.

**200 OK:**
```json
{
  "configurado": true,
  "horario": "10:10:40",
  "tocando": false,
  "ativo": false,
  "desligado": false
}
```

---

### `POST /api/alarme/parar` — Parar alarme

> ⚠️ **Não utilizado pelo frontend atual.**

**200 OK:**
```json
{ "mensagem": "Alarme parado.", "tocando": false }
```

---

## 🧮 Modelo matemático

### Ângulos

Dado um horário `HH:MM:SS`:

```
θ_horas    = (HH + MM/60) · 30°
θ_minutos  = (MM + SS/60) · 6°
θ_segundos =  SS · 6°
```

O fator `30°` vem de `360° / 12` (12 horas no mostrador).
O fator `6°` vem de `360° / 60` (60 minutos/segundos no mostrador).

### Rotação complexa

Cada ponteiro parte de `z₀ = i` (apontando para as 12h). Para girá-lo de `θ`:

```
z = comprimento · (cos θ + i·sen θ)
```

Isso é a **fórmula de Euler** `e^(iθ) = cos θ + i·sen θ`, aplicada a um vetor de comprimento `c`.

### Saída

O backend devolve:
- `rotacao.real = cos θ`, `rotacao.imaginaria = sen θ` — o **vetor unitário** na direção do ponteiro
- `multiplicacao.real = -sen θ`, `multiplicacao.imaginaria = cos θ` — o vetor unitário **girado 90°**
- `x`, `y` — as coordenadas cartesianas da ponta: `x = c·cos θ`, `y = c·sen θ`

### Módulo `matematica.py`

```python
calcular_angulos(hora: time) -> tuple[float, float, float]
    # Retorna (θ_horas, θ_minutos, θ_segundos) em graus

girar_ponto(angulo_graus: float) -> tuple[float, float]
    # Retorna (cos θ, sen θ)
```

### Módulo `alarme.py`

```python
class Alarme:
    horario: time
    ativo: bool
    desligado: bool
    ultimo_instante_verificado: datetime | None
    data_ultimo_disparo: date | None

    def verificar(self, hora_atual: datetime) -> None: ...
    def ativar(self, data: date) -> None: ...
    def parar(self) -> None: ...
    def esta_tocando(self) -> bool: ...
```

---

## 📁 Estrutura de arquivos

```
app/backend/
├── Dockerfile                          # Imagem do backend (python:3.11-slim)
├── .dockerignore
├── requirements.txt                    # Dependências de produção (enxuto)
├── README.md
│
├── api.py                              # App FastAPI, rotas
├── matematica.py                       # Cálculos puros (ângulos, rotação)
├── alarme.py                           # Classe Alarme (domínio)
├── relogio.py                          # Utilitários de renderização (matplotlib)
├── demonstracao_complexos.py           # Demo standalone (roda sem API)
│
└── testes/
    ├── testes_alarme.py
    └── testes_matematica.py
```

---

## 🧪 Testes

```bash
pytest -v
```

Cobertura:

- `testes_matematica.py` — ângulos corretos para horários conhecidos (12:00:00, 06:00:00, 03:30:00, etc.)
- `testes_alarme.py` — disparo na primeira verificação, disparo entre duas verificações, não disparar duas vezes no mesmo dia, comportamento de `parar()`

---

## 📏 Convenções

- **Strings de horário** sempre em `HH:MM:SS` (24h), zero-padded.
- **Ângulos** em graus (0–360), no sentido horário, com 0° = 12h.
- **Números complexos** sempre serializados como `{ real, imaginaria }` — nunca como string `"a + bi"` (a formatação é responsabilidade do cliente).
- **Arredondamento:** ângulos em 4 casas, partes real/imaginária em 6 casas.
- **Erros** sempre em `HTTPException` com `detail` legível em pt-BR.

---

## 🔗 Referências

- [FastAPI docs](https://fastapi.tiangolo.com/)
- [Pydantic docs](https://docs.pydantic.dev/)
- [Números complexos — Wikipédia](https://pt.wikipedia.org/wiki/N%C3%BAmero_complexo)
- [Fórmula de Euler — Wikipédia](https://pt.wikipedia.org/wiki/F%C3%B3rmula_de_Euler)
- [Docker — Get Started](https://docs.docker.com/get-started/)