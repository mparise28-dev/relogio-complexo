
import math
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from matematica import calcular_angulos, girar_ponto
from alarme import Alarme

# Cria a aplicação da API
app = FastAPI(title="Relógio com Números Complexos")

# Permite que o React acesse a API durante o desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Guarda o alarme configurado
alarme_atual = None


# Define os dados recebidos para configurar o alarme
class DadosAlarme(BaseModel):
    horario: str


# Verifica se a API está funcionando
@app.get("/")
def verificar_api():
    return {"mensagem": "API do relógio funcionando!"}


# Calcula a posição dos ponteiros para um horário informado
@app.get("/api/relogio")
def obter_relogio(horario: str = "10:10:30"):
    # Valida o formato do horário
    try:
        hora = datetime.strptime(horario, "%H:%M:%S").time()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Horário inválido. Use HH:MM:SS."
        )

    # Calcula os ângulos polares dos ponteiros.
    ang_horas, ang_minutos, ang_segundos = calcular_angulos(hora)

    dados_ponteiros = [
        ("horas", ang_horas, 0.55),
        ("minutos", ang_minutos, 0.78),
        ("segundos", ang_segundos, 0.95),
    ]

    ponteiros = {}

    for nome, angulo, comprimento in dados_ponteiros:
        x, y = girar_ponto(angulo)
        radianos = math.radians(angulo)

        # Guarda a rotação e a multiplicação de números complexos.
        ponteiros[nome] = {
            "angulo": round(angulo, 4),
            "rotacao": {
                "real": round(math.cos(radianos), 6),
                "imaginaria": round(math.sin(radianos), 6),
            },
            "multiplicacao": {
                "real": round(-math.sin(radianos), 6),
                "imaginaria": round(math.cos(radianos), 6),
            },
            "comprimento": comprimento,
            "x": round(x * comprimento, 6),
            "y": round(y * comprimento, 6),
        }

    return {
        "horario": horario,
        "ponteiros": ponteiros,
    }

# Configura ou substitui o horário do alarme
@app.post("/api/alarme")
def configurar_alarme(dados: DadosAlarme):
    global alarme_atual

    # Valida o horário informado
    try:
        horario = datetime.strptime(
            dados.horario, "%H:%M:%S"
        ).time()
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Horário inválido. Use HH:MM:SS."
        )

    # Cria o alarme e registra o instante inicial da verificação
    alarme_atual = Alarme(horario)
    alarme_atual.ultimo_instante_verificado = datetime.now()

    return {
        "mensagem": "Alarme configurado com sucesso.",
        "horario": dados.horario,
        "tocando": False,
    }


# Consulta o estado atual do alarme
@app.get("/api/alarme")
def consultar_alarme():
    if alarme_atual is None:
        return {
            "configurado": False,
            "tocando": False,
            "mensagem": "Nenhum alarme configurado.",
        }

    # Verifica se o horário do alarme foi alcançado
    alarme_atual.verificar(datetime.now())

    return {
        "configurado": True,
        "horario": alarme_atual.horario.strftime("%H:%M:%S"),
        "tocando": alarme_atual.esta_tocando(),
        "ativo": alarme_atual.ativo,
        "desligado": alarme_atual.desligado,
    }


# Interrompe o alarme quando solicitado
@app.post("/api/alarme/parar")
def parar_alarme():
    if alarme_atual is None:
        raise HTTPException(
            status_code=400,
            detail="Configure um alarme antes de pará-lo."
        )

    alarme_atual.parar()

    return {
        "mensagem": "Alarme parado.",
        "tocando": False,
    }
