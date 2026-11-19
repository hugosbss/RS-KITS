import { vi } from 'vitest';
import type {
  AppEvent,
  AppUser,
  useAppState,
} from '@/components/providers/app-context';
import type { ImportedRow } from '@/components/import/types';
import type { Athlete } from '@/components/delivery/types';
import type { AthleteReportRecord } from '@/components/reports/types';

export const event: AppEvent = {
  id: 'event1',
  name: 'Corrida Teste',
  date: '08/10/2026',
  place: 'Bauru/SP',
  status: 'EM_ANDAMENTO',
};
export const organizer: AppUser = {
  id: 'org1',
  name: 'Organizador Teste',
  role: 'ORGANIZADOR',
  email: 'org@example.com',
  cnpj: '12345678000199',
};
export const operator: AppUser = {
  id: 'op1',
  name: 'Operador Teste',
  role: 'OPERADOR',
  cpf: '98765432100',
  organizerId: organizer.id,
};
export const importedAthlete: ImportedRow = {
  id: 'athlete1',
  num: '101',
  nomeAtleta: 'Ana Silva',
  cpfAtleta: '12345678901',
  kit: 'Completo',
  modalidade: '5 KM',
  fxEtaria: '30–34',
  categEspecial: '',
  nascto: '01/02/1990',
  sexo: 'F',
  equipe: 'Equipe Azul',
  cidadeUf: 'Bauru/SP',
  camiseta: 'M',
  cel: '11999999999',
  email: 'ana@example.com',
  quemVaiRetirar: 'Atleta',
  notas: '',
  obs1: '',
  obs2: '',
  alerta: '',
  nomeEvento: event.name,
  statusValidacao: 'VALIDO',
  statusEntrega: 'PENDENTE',
  pin: '1234',
};
export const athlete: Athlete = {
  id: importedAthlete.id,
  num: '101',
  nome: 'Ana Silva',
  cpf: '12345678901',
  sexo: 'F',
  nascimento: '01/02/1990',
  cidadeUf: 'Bauru/SP',
  equipe: 'Equipe Azul',
  distancia: '5 KM',
  kit: 'Completo',
  faixaEtaria: '30–34',
  categoriaEspecial: '',
  camiseta: 'M',
  celular: '11999999999',
  email: 'ana@example.com',
  alerta: '',
  status: 'PENDENTE',
  pin: '1234',
};
export const reportAthlete: AthleteReportRecord = {
  ...importedAthlete,
  distancia: '5 KM',
  faixaEtaria: '30–34',
  categoriaEspecial: '',
  nascimento: '01/02/1990',
  sexo: 'F',
  retirarKit: 'Atleta',
  statusEntrega: 'PENDENTE',
  foiAlterado: true,
  camposAlterados: ['equipe'],
};
export function appState(
  overrides: Partial<ReturnType<typeof useAppState>> = {},
): ReturnType<typeof useAppState> {
  return {
    currentUser: { id: 'admin', name: 'Administrador', role: 'ADMIN' },
    users: [organizer, operator],
    events: [event],
    selectedEventId: event.id,
    selectedEvent: event,
    athletesByEvent: { [event.id]: [importedAthlete] },
    token: 'local-token',
    isAuthenticated: true,
    hydrated: true,
    sessionExpired: false,
    authUser: null,
    setCurrentUserId: vi.fn(),
    createUser: vi.fn().mockResolvedValue(operator),
    updateUser: vi.fn().mockResolvedValue(undefined),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    createEvent: vi.fn().mockResolvedValue(event),
    updateEvent: vi.fn().mockResolvedValue(undefined),
    deleteEvent: vi.fn().mockResolvedValue(undefined),
    selectEvent: vi.fn(),
    importAthletes: vi.fn().mockResolvedValue(undefined),
    updateAthlete: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}
