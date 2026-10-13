
import unittest
from datetime import datetime, time

from alarme import Alarme


class TestAlarme(unittest.TestCase):

    def test_alarme_comeca_desligado(self):
        alarme = Alarme(time(10, 0, 5))

        self.assertFalse(alarme.esta_tocando())

    
    def test_alarme_dispara_no_horario(self):
        alarme = Alarme(time(10, 0, 5))
        hora_atual = datetime(2026, 10, 11, 10, 0, 5)

        alarme.verificar(hora_atual)

        self.assertTrue(alarme.esta_tocando())
    
    
    def test_alarme_para_quando_solicitado(self):
        alarme = Alarme(time(10, 0, 5))
        hora_atual = datetime(2026, 10, 11, 10, 0, 5)

        alarme.verificar(hora_atual)
        self.assertTrue(alarme.esta_tocando())

        alarme.parar()

        self.assertFalse(alarme.esta_tocando())


    
    def test_alarme_permanece_desligado_apos_parar(self):
        alarme = Alarme(time(10, 0, 5))

        primeira_verificacao = datetime(2026, 10, 11, 10, 0, 5)
        alarme.verificar(primeira_verificacao)
        alarme.parar()

        segunda_verificacao = datetime(2026, 10, 11, 10, 0, 6)
        alarme.verificar(segunda_verificacao)

        self.assertFalse(alarme.esta_tocando())

    
    def test_alarme_nao_deve_perder_horario_por_atraso(self):
        alarme = Alarme(time(10, 0, 5))

        antes = datetime(2026, 10, 11, 10, 0, 4)
        depois = datetime(2026, 10, 11, 10, 0, 6)

        alarme.verificar(antes)
        alarme.verificar(depois)

        self.assertTrue(alarme.esta_tocando())
        

    
    def test_alarme_dispara_na_virada_da_meia_noite(self):
        alarme = Alarme(time(0, 0, 2))

        antes = datetime(2026, 10, 11, 23, 59, 58)
        depois = datetime(2026, 10, 12, 0, 0, 3)

        alarme.verificar(antes)
        alarme.verificar(depois)

        self.assertTrue(alarme.esta_tocando())

    def test_alarme_com_horario_passado_aguarda_proximo_dia(self):
        alarme = Alarme(time(9, 0, 0))

        agora = datetime(2026, 10, 11, 10, 0, 0)
        dia_seguinte = datetime(2026, 10, 12, 9, 0, 1)

        alarme.verificar(agora)
        self.assertFalse(alarme.esta_tocando())

        alarme.verificar(dia_seguinte)
        self.assertTrue(alarme.esta_tocando())

        




if __name__ == "__main__":
    unittest.main(verbosity=2)
