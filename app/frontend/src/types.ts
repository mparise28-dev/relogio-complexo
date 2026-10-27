export type NumeroComplexo = {
  real: number;
  imaginaria: number;
};

export type Ponteiro = {
  angulo: number;
  comprimento: number;
  x: number;
  y: number;
  rotacao: NumeroComplexo;
  multiplicacao: NumeroComplexo;
};

export type Ponteiros = {
  horas: Ponteiro;
  minutos: Ponteiro;
  segundos: Ponteiro;
};

export type DadosRelogio = {
  horario: string;
  ponteiros: Ponteiros;
};

export type InicioRelogio = {
  horario: string;
  instante: number;
};
