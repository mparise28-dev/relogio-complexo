
import unittest

from matematica import girar_ponto, calcular_angulos


class TestMatematica(unittest.TestCase):

    def test_ponto_no_topo(self):
        x, y = girar_ponto(90)
        self.assertAlmostEqual(x, 0, places=7)
        self.assertAlmostEqual(y, 1, places=7)

    def test_ponto_a_direita(self):
        x, y = girar_ponto(0)
        self.assertAlmostEqual(x, 1, places=7)
        self.assertAlmostEqual(y, 0, places=7)

    def test_ponto_em_baixo(self):
        x, y = girar_ponto(-90)
        self.assertAlmostEqual(x, 0, places=7)
        self.assertAlmostEqual(y, -1, places=7)

    def test_ponto_a_esquerda(self):
        x, y = girar_ponto(-180)
        self.assertAlmostEqual(x, -1, places=7)
        self.assertAlmostEqual(y, 0, places=7)

    def test_angulos_dos_ponteiros(self):
        from datetime import time

        horas, minutos, segundos = calcular_angulos(
            time(3, 15, 30)
        )

        self.assertAlmostEqual(horas, -7.75)
        self.assertAlmostEqual(minutos, -3)
        self.assertAlmostEqual(segundos, -90)


    def test_meia_noite(self):
        from datetime import time

        horas, minutos, segundos = calcular_angulos(
            time(0, 0, 0)
        )

        self.assertAlmostEqual(horas, 90)
        self.assertAlmostEqual(minutos, 90)
        self.assertAlmostEqual(segundos, 90)

    def test_meio_dia(self):
        from datetime import time

        horas, minutos, segundos = calcular_angulos(
            time(12, 0, 0)
        )

        self.assertAlmostEqual(horas, 90)
        self.assertAlmostEqual(minutos, 90)
        self.assertAlmostEqual(segundos, 90)

    def test_ultimo_segundo_do_dia(self):
        from datetime import time

        horas, minutos, segundos = calcular_angulos(
            time(23, 59, 59)
        )

        self.assertAlmostEqual(horas, -269.9916666667)
        self.assertAlmostEqual(minutos, -269.9)
        self.assertAlmostEqual(segundos, -264)



if __name__ == "__main__":
    unittest.main(verbosity=2)
