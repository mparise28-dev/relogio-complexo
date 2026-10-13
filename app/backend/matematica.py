
import math


def girar_ponto(angulo_graus):
    # Converte graus para radianos
    angulo = math.radians(angulo_graus)

    # Ponto inicial no topo do relogio
    z_inicial = 0 + 1j

    # Cria o numero complexo que representa a rotacao
    rotacao = complex(
        math.cos(angulo),
        math.sin(angulo)
    )

    # Multiplica os numeros complexos para girar o ponto
    z_final = z_inicial * rotacao

    # Devolve as coordenadas X e Y
    return z_final.real, z_final.imag


def calcular_angulos(hora):
    # Calcula o angulo dos segundos
    angulo_segundos = -hora.second * 6

    # Calcula o angulo dos minutos
    angulo_minutos = -(hora.minute + hora.second / 60) * 6

    # Calcula o angulo das horas
    angulo_horas = -(
        (hora.hour % 12)
        + hora.minute / 60
        + hora.second / 3600
    ) * 30

    return angulo_horas, angulo_minutos, angulo_segundos