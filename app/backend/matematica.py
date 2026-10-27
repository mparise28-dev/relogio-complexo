
import math


def girar_ponto(angulo_graus):
    angulo = math.radians(angulo_graus)
    z = complex(math.cos(angulo), math.sin(angulo))
    return z.real, z.imag


def calcular_angulos(hora):
    # O ângulo polar é medido do eixo real positivo; 90° aponta para 12h.
    angulo_segundos = 90 - hora.second * 6
    angulo_minutos = 90 - (hora.minute + hora.second / 60) * 6
    angulo_horas = 90 - (
        (hora.hour % 12)
        + hora.minute / 60
        + hora.second / 3600
    ) * 30

    return angulo_horas, angulo_minutos, angulo_segundos