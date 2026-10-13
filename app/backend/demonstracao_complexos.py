
import math
import numpy as np
import matplotlib.pyplot as plt

from datetime import datetime
from matplotlib.widgets import Slider, RadioButtons, TextBox, Button

from matematica import girar_ponto, calcular_angulos


# ==========================================
# 1. CONFIGURAÇÃO DA JANELA
# ==========================================

fig, ax = plt.subplots(figsize=(13, 8))
fig.subplots_adjust(
    left=0.07,
    right=0.61,
    bottom=0.20,
    top=0.88
)

fig.suptitle(
    "Laboratório de Números Complexos",
    fontsize=16
)

ax.set_xlim(-1.3, 1.3)
ax.set_ylim(-1.3, 1.3)
ax.set_aspect("equal")
ax.set_xlabel("Parte real (x)")
ax.set_ylabel("Parte imaginária (y)")
ax.grid(True)


# ==========================================
# 2. CIRCUNFERÊNCIA UNITÁRIA
# ==========================================

angulos_circulo = np.linspace(0, 2 * np.pi, 361)

ax.plot(
    np.cos(angulos_circulo),
    np.sin(angulos_circulo),
    linestyle="--",
    color="gray"
)


# ==========================================
# 3. ELEMENTOS DA ROTAÇÃO LIVRE
# ==========================================

ponteiro_livre, = ax.plot(
    [0, 0], [0, 1],
    linewidth=3,
    color="royalblue"
)

ponto_inicial, = ax.plot(
    [0], [1],
    marker="o",
    linestyle="None",
    color="green",
    label="Ponto inicial"
)

ponto_final, = ax.plot(
    [0], [1],
    marker="o",
    markersize=9,
    linestyle="None",
    color="royalblue",
    label="Ponto rotacionado"
)

ax.legend(loc="lower left")


# ==========================================
# 4. ELEMENTOS DO RELÓGIO
# ==========================================

ponteiro_horas, = ax.plot(
    [0, 0], [0, 0.55],
    linewidth=5,
    color="black"
)

ponteiro_minutos, = ax.plot(
    [0, 0], [0, 0.78],
    linewidth=3,
    color="royalblue"
)

ponteiro_segundos, = ax.plot(
    [0, 0], [0, 0.95],
    linewidth=1.5,
    color="crimson"
)

centro, = ax.plot(
    [0], [0],
    marker="o",
    color="black",
    markersize=5
)

numeros_relogio = []

for numero in range(1, 13):
    angulo = math.radians(90 - numero * 30)

    texto = ax.text(
        1.10 * math.cos(angulo),
        1.10 * math.sin(angulo),
        str(numero),
        ha="center",
        va="center",
        fontsize=11
    )

    numeros_relogio.append(texto)


# ==========================================
# 5. PAINEL DE INFORMAÇÕES
# ==========================================

ax_info = fig.add_axes([0.66, 0.18, 0.32, 0.65])
ax_info.axis("off")

informacao = ax_info.text(
    0,
    1,
    "",
    verticalalignment="top",
    fontsize=10,
    linespacing=1.5
)


# ==========================================
# 6. CONTROLES DA INTERFACE
# ==========================================

ax_modo = fig.add_axes([0.67, 0.85, 0.28, 0.10])

seletor_modo = RadioButtons(
    ax_modo,
    ("Rotação livre", "Relógio")
)

ax_slider = fig.add_axes([0.14, 0.13, 0.38, 0.035])

slider = Slider(
    ax_slider,
    "Ângulo (graus)",
    -360,
    360,
    valinit=0,
    valstep=1
)

ax_texto_hora = fig.add_axes([0.12, 0.055, 0.23, 0.045])

entrada_hora = TextBox(
    ax_texto_hora,
    "Horário ",
    initial="10:10:30"
)

ax_botao = fig.add_axes([0.38, 0.055, 0.15, 0.045])

botao_atualizar = Button(
    ax_botao,
    "Atualizar"
)

modo_atual = "Rotação livre"


# ==========================================
# 7. FORMATAÇÃO DOS NÚMEROS COMPLEXOS
# ==========================================

def formatar_complexo(z):
    real = 0 if abs(z.real) < 0.0005 else z.real
    imag = 0 if abs(z.imag) < 0.0005 else z.imag

    sinal = "+" if imag >= 0 else "-"

    return f"{real:.3f} {sinal} {abs(imag):.3f}i"


# ==========================================
# 8. MODO DE ROTAÇÃO LIVRE
# ==========================================

def atualizar_rotacao(valor=None):
    graus = slider.val
    radianos = math.radians(graus)

    z_inicial = 1j

    rotacao = complex(
        math.cos(radianos),
        math.sin(radianos)
    )

    x, y = girar_ponto(graus)
    z_final = complex(x, y)

    ponteiro_livre.set_data([0, x], [0, y])
    ponto_final.set_data([x], [y])

    sinal = "+" if z_final.imag >= 0 else "-"

    informacao.set_text(
        "MODO: ROTAÇÃO LIVRE\n\n"
        f"Ângulo: {graus:.0f} graus\n\n"
        "1. PONTO INICIAL\n"
        f"z₀ = {formatar_complexo(z_inicial)}\n\n"
        "2. ROTAÇÃO\n"
        "r = cos(θ) + i sen(θ)\n"
        f"r = {formatar_complexo(rotacao)}\n\n"
        "3. MULTIPLICAÇÃO\n"
        "z = z₀ × r\n"
        f"z = {formatar_complexo(z_final)}\n\n"
        "4. COORDENADAS FINAIS\n"
        f"x = {x:.3f}\n"
        f"y = {y:.3f}"
    )

    fig.canvas.draw_idle()


# ==========================================
# 9. MODO RELÓGIO
# ==========================================


def atualizar_relogio(event=None):
    try:
        horario = datetime.strptime(
            entrada_hora.text, "%H:%M:%S"
        ).time()
    except ValueError:
        informacao.set_text(
            "HORÁRIO INVÁLIDO\n\n"
            "Digite HH:MM:SS.\n"
            "Exemplo: 10:10:30"
        )
        fig.canvas.draw_idle()
        return

    ang_horas, ang_minutos, ang_segundos = calcular_angulos(horario)

    ponteiros = [
        ("HORAS", ponteiro_horas, ang_horas, 0.55),
        ("MINUTOS", ponteiro_minutos, ang_minutos, 0.78),
        ("SEGUNDOS", ponteiro_segundos, ang_segundos, 0.95),
    ]

    linhas = [
        f"HORÁRIO: {horario.strftime('%H:%M:%S')}",
        "",
        "ROTAÇÃO COM NÚMEROS COMPLEXOS",
        "Ponto inicial: z₀ = i",
    ]

    for nome, linha, angulo, comprimento in ponteiros:
        radianos = math.radians(angulo)

        rotacao = complex(
            math.cos(radianos),
            math.sin(radianos)
        )

        x, y = girar_ponto(angulo)
        z_final = complex(x, y)

        linha.set_data(
            [0, x * comprimento],
            [0, y * comprimento]
        )

        linhas.extend([
            "",
            f"--- {nome} ---",
            f"Ângulo: {angulo:.2f}°",
            f"Rotação: {formatar_complexo(rotacao)}",
            f"z = i × r = {formatar_complexo(z_final)}",
            f"x = {x:.3f} | y = {y:.3f}",
        ])

    informacao.set_text("\n".join(linhas))
    fig.canvas.draw_idle()



# ==========================================
# 10. ALTERNAR ENTRE OS MODOS
# ==========================================

def mudar_modo(rotulo):
    global modo_atual

    modo_atual = rotulo

    modo_livre = rotulo == "Rotação livre"

    ax_slider.set_visible(modo_livre)
    ax_texto_hora.set_visible(not modo_livre)
    ax_botao.set_visible(not modo_livre)

    ponteiro_livre.set_visible(modo_livre)
    ponto_inicial.set_visible(modo_livre)
    ponto_final.set_visible(modo_livre)

    ponteiro_horas.set_visible(not modo_livre)
    ponteiro_minutos.set_visible(not modo_livre)
    ponteiro_segundos.set_visible(not modo_livre)
    centro.set_visible(not modo_livre)

    for numero in numeros_relogio:
        numero.set_visible(not modo_livre)

    if modo_livre:
        atualizar_rotacao()
    else:
        atualizar_relogio()

    fig.canvas.draw_idle()


# ==========================================
# 11. CONECTAR OS CONTROLES
# ==========================================

slider.on_changed(atualizar_rotacao)
seletor_modo.on_clicked(mudar_modo)
botao_atualizar.on_clicked(atualizar_relogio)

# Estado inicial
mudar_modo("Rotação livre")

plt.show()
