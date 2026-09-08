const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api";

export { API_URL };

export type BackendUserRole = "ADMIN" | "ORGANIZADOR" | "OPERATOR";

export type BackendUser = {
  id: string;
  name: string;
  email: string | null;
  cpf: string | null;
  cnpj: string | null;
  role: BackendUserRole;
  phone: string | null;
  organizerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  access_token: string;
  user: BackendUser;
};

export type RegisterUser = {
  name: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  password: string;
  role: BackendUserRole;
  phone?: string;
};

type ApiError = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export async function login(
  identifier: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    let detail: ApiError = {};
    try {
      detail = (await response.json()) as ApiError;
    } catch {
      // corpo de erro não-JSON
    }
    let message = "Não foi possível entrar. Verifique suas credenciais.";
    if (Array.isArray(detail.message)) message = detail.message.join(". ");
    else if (typeof detail.message === "string" && detail.message) message = detail.message;

    throw new Error(message);
  }

  return (await response.json()) as LoginResponse;
}

export async function registerUser(
  data: RegisterUser,
  token: string,
): Promise<BackendUser> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let detail: ApiError = {};
    try {
      detail = (await response.json()) as ApiError;
    } catch {
      // corpo de erro não-JSON
    }
    let message = "Não foi possível criar o usuário.";
    if (Array.isArray(detail.message)) message = detail.message.join(". ");
    else if (typeof detail.message === "string" && detail.message) message = detail.message;

    throw new Error(message);
  }

  const body = (await response.json()) as { user: BackendUser };
  return body.user;
}

export async function fetchUsers(token: string): Promise<BackendUser[]> {
  const response = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Não foi possível carregar os usuários.");
  return (await response.json()) as BackendUser[];
}

export async function updateUserBackend(
  id: string,
  changes: { name?: string; cpf?: string; cnpj?: string; email?: string; phone?: string; password?: string },
  token: string,
): Promise<BackendUser> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(changes),
  });

  if (!response.ok) {
    let detail: ApiError = {};
    try {
      detail = (await response.json()) as ApiError;
    } catch {
      // corpo de erro não-JSON
    }
    throw new Error(typeof detail.message === "string" ? detail.message : "Não foi possível atualizar o usuário.");
  }
  return (await response.json()) as BackendUser;
}

export async function deleteUserBackend(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Não foi possível excluir o usuário.");
}

// ---------------------------------------------------------------------------
// Eventos e Atletas
// ---------------------------------------------------------------------------

export type BackendEventStatus =
  | "RASCUNHO"
  | "PROXIMO"
  | "EM_ANDAMENTO"
  | "FINALIZADO";

export type BackendEvent = {
  id: string;
  name: string;
  date: string;
  place: string | null;
  status: BackendEventStatus;
  createdAt: string;
  updatedAt: string;
  organizers?: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    assignedAt: string;
  }>;
};

export type BackendOrganizerLink = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  assignedAt: string;
};

export type BackendAthlete = {
  id: string;
  eventId: string;
  num: string | null;
  nomeAtleta: string;
  kit: string | null;
  distancia: string | null;
  fxEtaria: string | null;
  categEspecial: string | null;
  nascto: string | null;
  nascimento: string | null;
  sexo: string | null;
  equipe: string | null;
  cidadeUf: string | null;
  camiseta: string | null;
  cpfAtleta: string | null;
  cel: string | null;
  email: string | null;
  quemVaiRetirar: string | null;
  notas: string | null;
  obs1: string | null;
  obs2: string | null;
  alerta: string | null;
  nomeEvento: string | null;
  contato: string | null;
  grauParentesco: string | null;
  celularContato: string | null;
  pin: string | null;
  itensAdicionais: string | null;
  statusEntrega?: string | null;
  dataEntrega?: string | null;
  usuarioEntrega?: string | null;
  obsEntrega?: string | null;
  dataEstorno?: string | null;
  usuarioEstorno?: string | null;
  nomeEntrega?: string | null;
  cpfEntrega?: string | null;
  foneEntrega?: string | null;
  emailEntrega?: string | null;
  terceiro?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type EventPayload = {
  name?: string;
  date?: string;
  place?: string;
  status?: BackendEventStatus;
};

async function parseError(response: Response, fallback: string): Promise<never> {
  let detail: ApiError = {};
  try {
    detail = (await response.json()) as ApiError;
  } catch {
    // corpo de erro não-JSON
  }
  if (Array.isArray(detail.message)) throw new Error(detail.message.join(". "));
  throw new Error(
    typeof detail.message === "string" && detail.message ? detail.message : fallback,
  );
}

const jsonHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export async function fetchEvents(token: string): Promise<BackendEvent[]> {
  const response = await fetch(`${API_URL}/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response, "Não foi possível carregar os eventos.");
  return (await response.json()) as BackendEvent[];
}

export async function fetchEvent(token: string, eventId: string): Promise<BackendEvent> {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response, "Não foi possível carregar o evento.");
  return (await response.json()) as BackendEvent;
}

export async function createEventBackend(
  token: string,
  payload: EventPayload,
): Promise<BackendEvent> {
  const response = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseError(response, "Não foi possível criar o evento.");
  return (await response.json()) as BackendEvent;
}

export async function updateEventBackend(
  token: string,
  eventId: string,
  payload: EventPayload,
): Promise<BackendEvent> {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "PATCH",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseError(response, "Não foi possível atualizar o evento.");
  return (await response.json()) as BackendEvent;
}

export async function deleteEventBackend(token: string, eventId: string): Promise<void> {
  const response = await fetch(`${API_URL}/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response, "Não foi possível excluir o evento.");
}

export async function fetchEventOrganizers(
  token: string,
  eventId: string,
): Promise<BackendOrganizerLink[]> {
  const response = await fetch(`${API_URL}/events/${eventId}/organizers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response, "Não foi possível carregar os organizadores.");
  return (await response.json()) as BackendOrganizerLink[];
}

export async function addEventOrganizer(
  token: string,
  eventId: string,
  userId: string,
): Promise<BackendOrganizerLink[]> {
  const response = await fetch(`${API_URL}/events/${eventId}/organizers`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) await parseError(response, "Não foi possível vincular o organizador.");
  return (await response.json()) as BackendOrganizerLink[];
}

export async function removeEventOrganizer(
  token: string,
  eventId: string,
  userId: string,
): Promise<BackendOrganizerLink[]> {
  const response = await fetch(`${API_URL}/events/${eventId}/organizers/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response, "Não foi possível desvincular o organizador.");
  return (await response.json()) as BackendOrganizerLink[];
}

export async function fetchAthletes(
  token: string,
  eventId: string,
  query: { search?: string; limit?: number; offset?: number } = {},
): Promise<{ total: number; athletes: BackendAthlete[] }> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));
  const qs = params.toString();

  const response = await fetch(`${API_URL}/events/${eventId}/athletes${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response, "Não foi possível carregar os atletas.");
  return (await response.json()) as { total: number; athletes: BackendAthlete[] };
}

export async function importAthletesBackend(
  token: string,
  eventId: string,
  athletes: Array<Record<string, unknown>>,
): Promise<{ imported: number; updated: number; total: number }> {
  const response = await fetch(`${API_URL}/events/${eventId}/athletes`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify({ athletes }),
  });
  if (!response.ok) await parseError(response, "Não foi possível importar os atletas.");
  return (await response.json()) as { imported: number; updated: number; total: number };
}

export async function updateAthleteBackend(
  token: string,
  eventId: string,
  athleteId: string,
  changes: Record<string, unknown>,
): Promise<BackendAthlete> {
  const response = await fetch(`${API_URL}/events/${eventId}/athletes/${athleteId}`, {
    method: "PATCH",
    headers: jsonHeaders(token),
    body: JSON.stringify(changes),
  });
  if (!response.ok) await parseError(response, "Não foi possível atualizar o atleta.");
  return (await response.json()) as BackendAthlete;
}

export async function postAudit(
  token: string,
  payload: {
    acao: string;
    entidade?: string;
    entidadeId?: string;
    evento?: string;
    campo?: string;
    de?: unknown;
    para?: unknown;
    detalhe?: string;
    origem?: string;
  },
): Promise<void> {
  const response = await fetch(`${API_URL}/audit`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) await parseError(response, "Não foi possível registrar o log.");
}

export type AppDownload = {
  platform: string;
  file: string;
  size: number;
  url: string;
};

// Instaladores do app desktop (Linux/Windows) servidos pelo backend web.
export async function fetchDownloads(): Promise<AppDownload[]> {
  const response = await fetch(`${API_URL}/downloads`);
  if (!response.ok) throw new Error("Não foi possível carregar os downloads.");
  return (await response.json()) as AppDownload[];
}
