'use client';

export interface ImportedRow {
  id: string;
  num: string;
  nomeAtleta: string;
  kit: string;
  modalidade: string;
  fxEtaria: string;
  categEspecial: string;
  nascto: string;
  sexo: string;
  equipe: string;
  cidadeUf: string;
  camiseta: string;
  cpfAtleta: string;
  cel: string;
  email: string;
  quemVaiRetirar: string;
  notas: string;
  obs1: string;
  obs2: string;
  alerta: string;
  nomeEvento: string;
  contato?: string;
  grauParentesco?: string;
  celularContato?: string;
  pin?: string;
  itensAdicionais?: string;
  statusEntrega?: 'PENDENTE' | 'ENTREGUE' | 'ESTORNADO';
  dataEntrega?: string;
  usuarioEntrega?: string;
  obsEntrega?: string;
  dataEstorno?: string;
  usuarioEstorno?: string;
  nomeEntrega?: string;
  cpfEntrega?: string;
  foneEntrega?: string;
  emailEntrega?: string;
  terceiro?: boolean;
  statusValidacao: 'VALIDO' | 'ATENÇÃO' | 'ERRO';
}

export const TEMPLATE_HEADERS = [
  'Num',
  'Nome atleta',
  'KIT',
  'Distância',
  'Fx Etaria',
  'Categ Especial',
  'Nascto.',
  'Sexo',
  'Equipe',
  'Cidade/UF',
  'Camiseta',
  'CPF Atleta',
  'Cel',
  'E-mail',
  'Quem Vai retirar o KIT',
  'Notas',
  'Obs1',
  'Obs2',
  'Alerta',
  'Nome Evento',
  'Contato',
  'Grau Parentesco',
  'NºCelular',
  'PIN',
  'itens adicionais',
];
