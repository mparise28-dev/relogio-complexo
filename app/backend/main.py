
import sys
from pathlib import Path
from datetime import datetime, timedelta

import matplotlib.pyplot as plt
from matplotlib.widgets import Button, TextBox

# Permite encontrar os outros arquivos desta pasta
sys.path.insert(0, str(Path(__file__).resolve().parent))

from relogio import atualizar_relogio
from alarme import Alarme


# Define os horários iniciais da aplicação
agora = datetime.now()
entrada_hora = agora.strftime("%H:%M:%S")
entrada_alarme = (agora + timedelta(minutes=1)).strftime("%H:%M:%S")

hora_inicial = datetime.strptime(entrada_hora, "%H:%M:%S")
horario_alarme = datetime.strptime(entrada_alarme, "%H:%M:%S").time()

# Cria o objeto responsável pelo alarme
alarme = Alarme(horario_alarme)

# Marca o instante em que o relógio começou
inicio_contagem = datetime.now()


# Cria a janela do relógio
fig, ax = plt.subplots(figsize=(7, 7))
fig.subplots_adjust(right=0.82, bottom=0.32)

# Luz lateral: começa apagada
luz = fig.text(
    0.90, 0.50, "●",
    color="gray",
    fontsize=35,
    ha="center",
    va="center"
)

# Exibe mensagens de confirmação ou erro
status = fig.text(
    0.5, 0.095, "Configure os horários abaixo.",
    ha="center",
    va="center",
    fontsize=9
)

# Cria os campos de horário na janela
eixo_hora = fig.add_axes([0.08, 0.22, 0.34, 0.05])
campo_hora = TextBox(
    eixo_hora, "Início ", initial=entrada_hora
)

eixo_alarme = fig.add_axes([0.52, 0.22, 0.34, 0.05])
campo_alarme = TextBox(
    eixo_alarme, "Alarme ", initial=entrada_alarme
)


# Aplica um novo horário inicial
def aplicar_horario_inicial(event):
    global hora_inicial, inicio_contagem

    try:
        hora_inicial = datetime.strptime(
            campo_hora.text, "%H:%M:%S"
        )
    except ValueError:
        status.set_text("Horário inicial inválido. Use HH:MM:SS.")
        fig.canvas.draw_idle()
        return

    # Reinicia a contagem a partir do horário escolhido
    inicio_contagem = datetime.now()
    status.set_text(
        f"Horário inicial aplicado: {campo_hora.text}"
    )
    fig.canvas.draw_idle()


# Aplica um novo horário para o alarme
def aplicar_horario_alarme(event):
    global alarme

    try:
        horario = datetime.strptime(
            campo_alarme.text, "%H:%M:%S"
        ).time()
    except ValueError:
        status.set_text("Horário do alarme inválido. Use HH:MM:SS.")
        fig.canvas.draw_idle()
        return

    # Substitui o alarme pelo novo horário configurado
    alarme = Alarme(horario)
    luz.set_color("gray")
    status.set_text(
        f"Alarme configurado para {campo_alarme.text}"
    )
    fig.canvas.draw_idle()


# Interrompe o alarme e apaga a luz
def parar_alarme(event):
    alarme.parar()
    luz.set_color("gray")
    status.set_text("Alarme interrompido.")
    fig.canvas.draw_idle()


# Cria os botões e conecta suas ações
eixo_aplicar_hora = fig.add_axes([0.08, 0.13, 0.34, 0.055])
botao_hora = Button(eixo_aplicar_hora, "Aplicar início")
botao_hora.on_clicked(aplicar_horario_inicial)

eixo_aplicar_alarme = fig.add_axes([0.52, 0.13, 0.34, 0.055])
botao_alarme = Button(eixo_aplicar_alarme, "Aplicar alarme")
botao_alarme.on_clicked(aplicar_horario_alarme)

eixo_parar = fig.add_axes([0.35, 0.025, 0.30, 0.055])
botao_parar = Button(eixo_parar, "Parar alarme")
botao_parar.on_clicked(parar_alarme)


# Estado inicial da luz durante o piscar
piscar = False


# Atualiza o relógio enquanto a janela estiver aberta
while plt.fignum_exists(fig.number):

    # Calcula quantos segundos se passaram desde o início
    segundos_passados = int(
        (datetime.now() - inicio_contagem).total_seconds()
    )

    # Calcula o horário atual do relógio
    hora_atual = hora_inicial + timedelta(
        seconds=segundos_passados
    )

    # Verifica se chegou o horário do alarme
    alarme.verificar(hora_atual)

    # Redesenha os ponteiros
    atualizar_relogio(ax, hora_atual)

    # Faz a luz piscar enquanto o alarme estiver ativo
    if alarme.esta_tocando():
        piscar = not piscar

        if piscar:
            luz.set_color("red")
        else:
            luz.set_color("gray")
    else:
        luz.set_color("gray")
        piscar = False

    # Atualiza a janela e aguarda um pouco
    fig.canvas.draw_idle()
    plt.pause(0.2)
