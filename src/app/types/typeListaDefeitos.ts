export type typeListaDefeitos = {
  item: string;
  defeito: string[];
};

export type RegistroDefeito = {
  id: string;
  sequencia: string;
  item: string;
  defeito: string;
  detalhes: string;
  vin: string;
  hmcTl: string;
  hmcTm: string;
  processo: string;
  createdAt: string;
  updatedAt: string;
};

export type CampoEditavelRegistro =
  | "vin"
  | "hmcTl"
  | "hmcTm"
  | "processo"
  | "detalhes";
