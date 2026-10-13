
from datetime import datetime, timedelta


class Alarme:
    def __init__(self, horario):
        self.horario = horario
        self.ativo = False
        self.desligado = False

        # Guarda o instante da última verificação
        self.ultimo_instante_verificado = None

        # Guarda o dia em que o alarme já disparou
        self.data_ultimo_disparo = None

    def verificar(self, hora_atual):
        anterior = self.ultimo_instante_verificado
        self.ultimo_instante_verificado = hora_atual

        # Não dispara novamente no mesmo dia
        if self.data_ultimo_disparo == hora_atual.date():
            return

        # Na primeira verificação, aceita o horário exato
        if anterior is None:
            if hora_atual.time() == self.horario:
                self.ativar(hora_atual.date())
            return

        # Procura o horário do alarme entre as duas verificações
        data_verificar = anterior.date()

        while data_verificar <= hora_atual.date():
            instante_alarme = datetime.combine(
                data_verificar, self.horario
            )

            if (
                anterior < instante_alarme <= hora_atual
                and data_verificar != self.data_ultimo_disparo
            ):
                self.ativar(data_verificar)
                break

            data_verificar += timedelta(days=1)

    def ativar(self, data):
        self.ativo = True
        self.desligado = False
        self.data_ultimo_disparo = data
        print("ALARME ATIVADO!")

    def parar(self):
        self.desligado = True
        self.ativo = False

    def esta_tocando(self):
        return self.ativo and not self.desligado
