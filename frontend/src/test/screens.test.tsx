import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  appState,
  event,
  organizer,
  operator,
  importedAthlete,
} from './fixtures';
import * as api from '@/services/api';
import { navigateTo, replaceLocation } from '@/services/navigation';
import DashboardPage from '@/app/dashboard/page';
import DeliveryPage from '@/app/delivery/page';
import EventsPage from '@/app/events/page';
import UsersPage from '@/app/users/page';
import SettingsPage from '@/app/settings/page';
import ImportPage from '@/app/import/page';
import ReportsPage from '@/app/reports/page';
import FiltersPage from '@/app/filters/page';
import DownloadsPage from '@/app/downloads/page';
import SecondScreenPage from '@/app/delivery/second-screen/page';
import { Sidebar } from '@/components/layout/sidebar';
import { EventManagement } from '@/components/events/event-management';

let state = appState();
vi.mock('@/components/providers/app-context', () => ({
  useAppState: () => state,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock('@/services/api');
vi.mock('@/services/navigation');
vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: () => <div data-testid="animation" />,
}));
vi.mock('@/services/weather', async (original) => ({
  ...(await original<typeof import('@/services/weather')>()),
  getWeather: vi.fn().mockResolvedValue({
    city: 'Bauru',
    temperature: 25,
    feelsLike: 26,
    humidity: 60,
    windSpeed: 10,
    precipitation: 0,
    weatherCode: 0,
    description: 'Céu limpo',
    isDay: true,
    daily: [],
  }),
}));
const backendOrganizer = {
  id: organizer.id,
  name: organizer.name,
  email: organizer.email!,
  cpf: null,
  cnpj: organizer.cnpj!,
  phone: null,
  role: 'ORGANIZADOR' as const,
  createdAt: '',
  updatedAt: '',
  assignedAt: '',
};
beforeEach(() => {
  state = appState();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  for (const fn of Object.values(api))
    if (vi.isMockFunction(fn)) fn.mockReset().mockResolvedValue([]);
  vi.mocked(api.fetchEventOrganizers).mockResolvedValue([backendOrganizer]);
});
function mount(node: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
  );
}
describe('authenticated application pages', () => {
  it('validates PIN and edits the identified athlete', async () => {
    mount(<DeliveryPage />);
    fireEvent.click(screen.getByRole('button', { name: /CÓDIGO PIN/ }));
    fireEvent.change(screen.getByPlaceholderText('0000'), {
      target: { value: '9999' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Inválido')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('0000'), {
      target: { value: '1234' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(
      screen.getByRole('button', { name: /CONFIRMAR ENTREGA/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Editar Cadastro' }));
    fireEvent.change(screen.getByDisplayValue('Ana Silva'), {
      target: { value: 'Ana Souza' },
    });
    fireEvent.submit(screen.getByDisplayValue('Ana Souza').closest('form')!);
    expect(state.updateAthlete).toHaveBeenCalledWith(
      importedAthlete.id,
      expect.objectContaining({ nomeAtleta: 'Ana Souza' }),
    );
  });
  it('requires confirmation before resetting all kit deliveries', () => {
    mount(<DeliveryPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Utilitários' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zerar Entregas' }));
    expect(
      screen.getByRole('button', { name: 'Sim, zerar tudo' }),
    ).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('ZERAR ENTREGAS'), {
      target: { value: 'zerar entregas' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sim, zerar tudo' }));
    expect(state.updateAthlete).toHaveBeenCalledWith(
      importedAthlete.id,
      expect.objectContaining({
        statusEntrega: 'PENDENTE',
        nomeEntrega: null,
        dataEntrega: null,
        dataEstorno: null,
        terceiro: false,
      }),
    );
  });
  it('draws a winner from the chosen filters and records an audit', () => {
    vi.useFakeTimers();
    try {
      mount(<DeliveryPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Utilitários' }));
      fireEvent.click(screen.getByRole('button', { name: 'Realizar Sorteio' }));
      const selects = screen.getAllByRole('combobox');
      ['5 KM', '30–34', 'Bauru/SP'].forEach((value, index) =>
        fireEvent.change(selects[index], { target: { value } }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'SORTEAR AGORA' }));
      expect(
        screen.getByRole('button', { name: 'SORTEANDO...' }),
      ).toBeDisabled();
      act(() => vi.advanceTimersByTime(1800));
      expect(screen.getByText('Ganhador do Sorteio!')).toBeInTheDocument();
      expect(api.postAudit).toHaveBeenCalledWith(
        'local-token',
        expect.objectContaining({
          acao: 'SORTEIO',
          entidadeId: importedAthlete.id,
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });
  it.each([false, true])(
    'creates an event and reports server failure (%s)',
    async (fails) => {
      const close = vi.fn();
      if (fails)
        vi.mocked(state.createEvent).mockRejectedValueOnce(
          new Error('Falha ao salvar evento'),
        );
      mount(<EventManagement showCreate onCloseCreate={close} />);
      fireEvent.change(screen.getByLabelText('Nome do evento'), {
        target: { value: '  Nova Corrida  ' },
      });
      fireEvent.change(screen.getByLabelText('Data'), {
        target: { value: '2026-11-10' },
      });
      fireEvent.change(screen.getByLabelText('Cidade'), {
        target: { value: 'Bauru' },
      });
      fireEvent.submit(
        screen.getByLabelText('Nome do evento').closest('form')!,
      );
      await waitFor(() =>
        expect(state.createEvent).toHaveBeenCalledWith({
          name: 'Nova Corrida',
          date: '2026-11-10',
          place: 'Bauru',
        }),
      );
      if (fails) {
        expect(
          await screen.findByText('Falha ao salvar evento'),
        ).toBeInTheDocument();
        expect(close).not.toHaveBeenCalled();
      } else {
        expect(
          await screen.findByText('Evento criado com sucesso'),
        ).toBeInTheDocument();
        expect(close).toHaveBeenCalled();
      }
    },
  );
  it.each([
    ['dashboard', DashboardPage, 'Corrida Teste'],
    ['delivery', DeliveryPage, 'Ana Silva'],
    ['events', EventsPage, 'Criar novo evento'],
    ['users', UsersPage, 'Adicionar usuário'],
    ['settings', SettingsPage, 'Downloads do aplicativo'],
    ['imports', ImportPage, 'Clique aqui para selecionar'],
    ['reports', ReportsPage, 'Histórico Estático'],
    ['filters', FiltersPage, 'Rel - Modalidade'],
    ['downloads', DownloadsPage, 'Aplicativo limpo'],
    ['second screen', SecondScreenPage, 'Corrida Teste'],
  ] as const)('renders %s using actual modules', async (_name, Page, label) => {
    mount(<Page />);
    await waitFor(() =>
      expect(screen.getAllByText(new RegExp(label))[0]).toBeInTheDocument(),
    );
  });
  it('shows an empty dashboard without inventing athletes', async () => {
    state = appState({
      selectedEvent: null,
      selectedEventId: null,
      events: [],
      athletesByEvent: {},
    });
    mount(<DashboardPage />);
    expect(
      screen.getByRole('heading', { name: 'Nenhum evento selecionado' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sem equipes ainda.')).toBeInTheDocument();
  });
  it('filters dashboard activity by athlete name', async () => {
    state.athletesByEvent[event.id] = [
      {
        ...importedAthlete,
        statusEntrega: 'ENTREGUE',
        dataEntrega: '08/10/2026 10:00',
        usuarioEntrega: 'Operador',
      },
      {
        ...importedAthlete,
        id: 'athlete2',
        nomeAtleta: 'Bruno',
        num: '102',
        statusEntrega: 'ESTORNADO',
      },
    ];
    mount(<DashboardPage />);
    fireEvent.change(screen.getByPlaceholderText(/Busca rápida/), {
      target: { value: 'Bruno' },
    });
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument();
  });
  it('filters events and denies event management to organizers', async () => {
    const { rerender } = mount(<EventsPage />);
    await screen.findAllByText(event.name);
    fireEvent.change(screen.getByPlaceholderText(/Buscar/), {
      target: { value: 'inexistente' },
    });
    expect(screen.getByText('Nenhum evento encontrado.')).toBeInTheDocument();
    state = appState({ currentUser: organizer });
    rerender(<EventsPage />);
    expect(
      screen.getByRole('heading', { name: 'Acesso restrito' }),
    ).toBeInTheDocument();
  });
  it('selects the current event and routes to user associations/downloads', async () => {
    state = appState({ selectedEventId: null });
    mount(<EventManagement />);
    await screen.findAllByText(event.name);
    fireEvent.click(
      screen.getByRole('button', { name: /Selecionar|Usar evento/ }),
    );
    expect(state.selectEvent).toHaveBeenCalledWith(event.id);
    fireEvent.click(screen.getByRole('button', { name: /Usuários/ }));
    expect(navigateTo).toHaveBeenCalledWith(`/users?evento=${event.id}`);
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(navigateTo).toHaveBeenCalledWith(`/downloads?evento=${event.id}`);
  });
  it('edits and deletes an event only after explicit interaction', async () => {
    mount(<EventManagement />);
    fireEvent.click(
      await screen.findByRole('button', { name: `Editar ${event.name}` }),
    );
    await screen.findByDisplayValue(event.name);
    fireEvent.change(screen.getByDisplayValue(event.name), {
      target: { value: 'Corrida Atualizada' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));
    await waitFor(() =>
      expect(state.updateEvent).toHaveBeenCalledWith(
        event.id,
        expect.objectContaining({ name: 'Corrida Atualizada' }),
      ),
    );
    fireEvent.click(
      screen.getByRole('button', { name: `Excluir ${event.name}` }),
    );
    expect(state.deleteEvent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() =>
      expect(state.deleteEvent).toHaveBeenCalledWith(event.id),
    );
  });
  it('searches users and keeps organizer scope limited to their operators', async () => {
    const { rerender } = mount(<UsersPage />);
    await screen.findByText(operator.name);
    fireEvent.change(screen.getByPlaceholderText(/Buscar nome/), {
      target: { value: 'Operador' },
    });
    expect(
      screen.queryByText(organizer.name, { selector: 'td *' }),
    ).not.toBeInTheDocument();
    state = appState({
      currentUser: organizer,
      users: [
        organizer,
        operator,
        {
          ...operator,
          id: 'other',
          name: 'Outro Operador',
          organizerId: 'other-org',
        },
      ],
    });
    rerender(<UsersPage />);
    expect(screen.queryByText('Outro Operador')).not.toBeInTheDocument();
  });
  it('shows only users and organizer choices linked to the selected event', async () => {
    state = appState({
      events: [event, { ...event, id: 'other-event', name: 'Outro evento' }],
      users: [
        organizer,
        operator,
        { ...organizer, id: 'foreign-org', name: 'Organizador externo' },
        {
          ...operator,
          id: 'foreign-op',
          name: 'Operador externo',
          organizerId: 'foreign-org',
        },
      ],
    });
    vi.mocked(api.fetchEventOrganizers).mockImplementation(
      async (_token, id) => [
        {
          ...backendOrganizer,
          id: id === event.id ? organizer.id : 'foreign-org',
        },
      ],
    );
    mount(<UsersPage />);
    await screen.findByText(operator.name);
    expect(screen.queryByText('Operador externo')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Organizador externo' }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filtrar por evento'), {
      target: { value: 'other-event' },
    });
    expect(await screen.findByText('Operador externo')).toBeInTheDocument();
    expect(screen.queryByText(operator.name)).not.toBeInTheDocument();
  });
  it('validates operator owner before creating a user and handles API failure', async () => {
    mount(<UsersPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar usuário' }));
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Novo Operador' },
    });
    fireEvent.change(screen.getByLabelText('CPF'), {
      target: { value: '12345678901' },
    });
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'operator123' },
    });
    const form = screen.getByLabelText('Nome').closest('form')!;
    fireEvent.submit(form);
    expect(
      await screen.findByText(/Selecione o organizador responsável/),
    ).toBeInTheDocument();
    expect(state.createUser).not.toHaveBeenCalled();
    fireEvent.focus(screen.getByPlaceholderText('Selecionar organizador...'));
    fireEvent.click(screen.getByRole('button', { name: organizer.name }));
    vi.mocked(state.createUser).mockRejectedValueOnce(
      new Error('Servidor indisponível'),
    );
    fireEvent.submit(form);
    expect(
      await screen.findByText('Servidor indisponível'),
    ).toBeInTheDocument();
    fireEvent.submit(form);
    await waitFor(() =>
      expect(state.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'OPERADOR',
          organizerId: organizer.id,
          name: 'Novo Operador',
        }),
      ),
    );
  });
  it('restricts users and settings for operators', () => {
    state = appState({ currentUser: operator });
    const { rerender } = mount(<UsersPage />);
    expect(
      screen.getByRole('heading', { name: 'Acesso restrito' }),
    ).toBeInTheDocument();
    rerender(<SettingsPage />);
    expect(
      screen.queryByText('Downloads do aplicativo'),
    ).not.toBeInTheDocument();
  });
  it('links settings to the appropriate modules and supports the old event URL', () => {
    const { rerender } = mount(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar usuários' }));
    expect(navigateTo).toHaveBeenCalledWith('/users');
    fireEvent.click(
      screen.getByRole('button', { name: 'Downloads do aplicativo' }),
    );
    expect(navigateTo).toHaveBeenCalledWith('/downloads');
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar eventos' }));
    expect(navigateTo).toHaveBeenCalledWith('/events');
    window.history.replaceState({}, '', '/settings?tab=evento');
    state = appState();
    rerender(<SettingsPage />);
    state = appState({ currentUser: organizer });
    rerender(<SettingsPage />);
    state = appState();
    rerender(<SettingsPage />);
    expect(replaceLocation).toHaveBeenCalledWith('/events?criar=1');
  });
  it.each(['ADMIN', 'ORGANIZADOR', 'OPERADOR'] as const)(
    'limits sidebar links for %s and logs out',
    (role) => {
      state = appState({ currentUser: { id: 'user', name: 'Pessoa', role } });
      mount(<Sidebar />);
      expect(!!screen.queryByRole('link', { name: 'Eventos' })).toBe(
        role === 'ADMIN',
      );
      expect(!!screen.queryByRole('link', { name: 'Downloads' })).toBe(
        role === 'ADMIN',
      );
      fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
      expect(state.logout).toHaveBeenCalledOnce();
      expect(navigateTo).toHaveBeenCalledWith('/login');
    },
  );
  it('delivers and reverses the selected athlete kit', async () => {
    mount(<DeliveryPage />);
    await screen.findByText('Ana Silva');
    fireEvent.click(screen.getByTitle('Entregar Kit'));
    expect(state.updateAthlete).toHaveBeenCalledWith(
      importedAthlete.id,
      expect.objectContaining({ statusEntrega: 'ENTREGUE' }),
    );
    fireEvent.click(await screen.findByTitle('Estornar Kit'));
    expect(state.updateAthlete).toHaveBeenLastCalledWith(
      importedAthlete.id,
      expect.objectContaining({ statusEntrega: 'ESTORNADO' }),
    );
  });
  it('keeps a failed delivery pending and allows a successful retry', async () => {
    vi.mocked(state.updateAthlete).mockRejectedValueOnce(
      new Error('Falha na gravação'),
    );
    mount(<DeliveryPage />);
    fireEvent.click(await screen.findByTitle('Entregar Kit'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha na gravação',
    );
    expect(screen.getByTitle('Entregar Kit')).toBeInTheDocument();
    expect(screen.queryByTitle('Estornar Kit')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Entregar Kit'));
    expect(await screen.findByTitle('Estornar Kit')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('opens athlete details, verifies PIN errors and selects matching athletes', async () => {
    mount(<DeliveryPage />);
    await screen.findByText('Ana Silva');
    fireEvent.keyDown(screen.getByPlaceholderText(/Buscar atleta/), {
      key: 'Enter',
    });
    expect(
      screen.getByRole('button', { name: /CONFIRMAR ENTREGA/ }),
    ).toBeInTheDocument();
  });
  it('switches every filter report and applies demographic filters', () => {
    state.athletesByEvent[event.id] = [
      importedAthlete,
      {
        ...importedAthlete,
        id: 'other',
        sexo: 'M',
        nascto: 'invalid',
        modalidade: '10 KM',
        equipe: 'Equipe Verde',
        camiseta: 'G',
        cidadeUf: 'Campinas/SP',
        statusEntrega: 'ENTREGUE',
        dataEntrega: '08/10/2026 09:00',
        usuarioEntrega: 'Operador',
      },
    ];
    mount(<FiltersPage />);
    const names = [
      'Rel - Equipe',
      'Rel - Cidade',
      'Rel - Camiseta',
      'Rel - Sexo',
      'Rel - Sexo e Distância',
      'Rel - Idade (Faixas)',
      'Rel - Entregas (Dia/Hora/Usuário)',
      'Rel - Modalidade',
    ];
    for (const name of names)
      fireEvent.click(screen.getByRole('button', { name }));
    const select = screen.getAllByRole('combobox');
    select.slice(1).forEach((element) => {
      const option = (element as HTMLSelectElement).options[1];
      if (option)
        fireEvent.change(element, { target: { value: option.value } });
    });
    fireEvent.change(select[0], { target: { value: event.id } });
    expect(state.selectEvent).toHaveBeenCalledWith(event.id);
  });
  it('shows filter empty state without athlete data', () => {
    state = appState({ athletesByEvent: {} });
    mount(<FiltersPage />);
    expect(screen.getByText('Nenhum atleta para analisar')).toBeInTheDocument();
  });
  it('switches actual reports and generates a delivery relation', () => {
    mount(<ReportsPage />);
    fireEvent.click(
      screen.getByRole('button', { name: /Modelo.*Atualiza|Excel Modelo/i }),
    );
    expect(
      screen.getByRole('heading', { name: 'Excel Modelo e Exportação' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Relação de Entrega/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Gerar relatório' }));
    expect(
      screen.getByRole('button', { name: /Exportar relação/ }),
    ).toBeEnabled();
  });
});
