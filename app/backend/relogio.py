
import matplotlib.pyplot as plt
from matplotlib.widgets import Button

from matematica import girar_ponto, calcular_angulos


def desenhar_ponteiro(ax, angulo, comprimento, cor, espessura):
    # Calcula a ponta do ponteiro
    x, y = girar_ponto(angulo)

    # Desenha o ponteiro a partir do centro
    ax.plot(
        [0, x * comprimento],
        [0, y * comprimento],
        color=cor,
        linewidth=espessura,
        solid_capstyle="round"
    )


def atualizar_relogio(ax, hora):
    # Limpa o desenho anterior
    ax.clear()

    # Desenha o mostrador
    circulo = plt.Circle(
        (0, 0), 1, fill=False, linewidth=2
    )
    ax.add_patch(circulo)

    # Desenha os numeros
    for numero in range(1, 13):
        x, y = girar_ponto(90 - numero * 30)

        ax.text(
            x * 0.85,
            y * 0.85,
            str(numero),
            ha="center",
            va="center",
            fontsize=14
        )

    # Recebe os angulos calculados pelo modulo matematico
    angulo_horas, angulo_minutos, angulo_segundos = (
        calcular_angulos(hora)
    )

    # Desenha os ponteiros
    desenhar_ponteiro(
        ax, angulo_horas, 0.50, "black", 5
    )
    desenhar_ponteiro(
        ax, angulo_minutos, 0.72, "blue", 3
    )
    desenhar_ponteiro(
        ax, angulo_segundos, 0.88, "red", 1.5
    )

    # Marca o centro
    ax.plot(0, 0, "o", color="black", markersize=7)

    # Mostra o horario digital
    ax.set_title(hora.strftime("%H:%M:%S"), fontsize=16)

    # Configura a visualizacao
    ax.set_xlim(-1.15, 1.15)
    ax.set_ylim(-1.15, 1.15)
    ax.set_aspect("equal")
    ax.axis("off")
