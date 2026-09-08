from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1)
    password: str = Field(min_length=1)


class OperatorCreate(BaseModel):
    name: str = Field(min_length=1)
    email: str | None = None
    cpf: str | None = None
    password: str = Field(min_length=1)
    organizer_id: str | None = None


class OrganizerCreate(BaseModel):
    name: str = Field(min_length=1)
    cpf: str | None = None
    cnpj: str | None = None
    email: str | None = None
    phone: str | None = None
    accessCode: str | None = None
    password: str = Field(min_length=1)


class UserUpdate(BaseModel):
    name: str | None = None
    cpf: str | None = None
    cnpj: str | None = None
    email: str | None = None
    phone: str | None = None
    password: str | None = None


class EventUpdate(BaseModel):
    name: str | None = None
    date: str | None = None
    place: str | None = None
    status: str | None = None


class AuditCreate(BaseModel):
    acao: str
    entidade: str = "ATLETA"
    entidadeId: str | None = None
    evento: str | None = None
    detalhe: str | None = None
    origem: str = "SISTEMA"


class EventCreate(BaseModel):
    name: str = Field(min_length=1)
    date: str | None = None
    place: str | None = None
    status: str = "EM_ANDAMENTO"


class DeliverRequest(BaseModel):
    athlete_id: str = Field(min_length=1)
    usuario: str
    nome_entrega: str | None = None
    cpf_entrega: str | None = None
    fone_entrega: str | None = None
    email_entrega: str | None = None
    terceiro: bool = False


class ReverseRequest(BaseModel):
    athlete_id: str = Field(min_length=1)
    usuario: str


class InstallRequest(BaseModel):
    filename: str = Field(min_length=1)


class SyncSettings(BaseModel):
    cloud_url: str