"use client";

import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAppState } from "@/components/providers/app-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SettingsShell() {
  const { currentUser, users, createUser } = useAppState();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", cpf: "", password: "", accessCode: "", phone: "" });
  const isAdmin = currentUser.role === "ADMIN";
  const operators = users.filter((user) => user.role === "OPERADOR" && (!isAdmin ? user.organizerId === currentUser.id : true));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.cpf || !form.password || (isAdmin && (!form.accessCode || !form.phone))) return;
    createUser(isAdmin
      ? { role: "ORGANIZADOR", name: form.name, cpf: form.cpf, password: form.password, accessCode: form.accessCode, phone: form.phone }
      : { role: "OPERADOR", name: form.name, cpf: form.cpf, password: form.password, organizerId: currentUser.id });
    setForm({ name: "", cpf: "", password: "", accessCode: "", phone: "" });
    setMessage(isAdmin ? "Organizador criado e pronto para cadastrar operadores." : "Acesso de operador criado com sucesso.");
  };

  if (currentUser.role === "OPERADOR") return null;
  const title = isAdmin ? "Criar organizador" : "Criar acesso de operador";
  return <div className="min-h-screen bg-slate-50 text-slate-950"><Sidebar /><main className="space-y-6 p-4 sm:p-6 lg:ml-64 lg:p-8">
    <header><p className="text-sm font-semibold text-blue-600">Controle de acesso</p><h1 className="mt-1 text-3xl font-black">Configurações</h1><p className="mt-2 text-sm text-slate-500">{isAdmin ? "Cadastre os responsáveis pelos eventos e acompanhe os acessos." : "Cadastre os operadores responsáveis pela entrega de kits."}</p></header>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><Card className="border-slate-200 p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserPlus className="h-5 w-5" /></div><div><h2 className="font-bold">{title}</h2><p className="text-sm text-slate-500">{isAdmin ? "O organizador poderá criar os usuários operadores." : "Este acesso ficará vinculado ao seu organizador."}</p></div></div>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Nome<input required value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label><label className="text-sm font-semibold">CPF<input required value={form.cpf} onChange={(e) => setForm({...form, cpf:e.target.value})} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>{isAdmin && <><label className="text-sm font-semibold">Código de acesso<input required value={form.accessCode} onChange={(e) => setForm({...form, accessCode:e.target.value})} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label><label className="text-sm font-semibold">Telefone<input required value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label></>}<label className="text-sm font-semibold sm:col-span-2">Senha<input required type="password" value={form.password} onChange={(e) => setForm({...form, password:e.target.value})} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label><div className="sm:col-span-2"><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><KeyRound className="mr-2 h-4 w-4" /> Criar acesso</Button>{message && <span className="ml-3 text-sm font-medium text-emerald-700">{message}</span>}</div></form>
    </Card><Card className="border-slate-200 p-5 shadow-sm"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-600" /><h2 className="font-bold">{isAdmin ? "Organizadores" : "Operadores cadastrados"}</h2></div><div className="mt-4 space-y-3">{(isAdmin ? users.filter((user) => user.role === "ORGANIZADOR") : operators).map((user) => <div key={user.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="font-semibold text-slate-800">{user.name}</p><p className="mt-1 text-xs text-slate-500">CPF: {user.cpf}</p>{user.accessCode && <p className="mt-1 text-xs text-blue-600">Código: {user.accessCode}</p>}</div>)}{!operators.length && !isAdmin && <p className="text-sm text-slate-500">Nenhum operador cadastrado.</p>}</div></Card></div>
    {/* <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><div className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0" />
    <p>Esta é uma validação frontend: usuários, eventos selecionados e importações ficam somente no navegador atual até a integração com o backend.</p>
    </div>
    </Card> */}
  </main></div>;
}
