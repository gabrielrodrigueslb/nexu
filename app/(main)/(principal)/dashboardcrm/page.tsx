import {
  BadgeDollarSign,
  MessageSquareMore,
  PhoneCall,
  Target,
  UserPlus,
} from "lucide-react";

const pipeline = [
  {
    stage: "Entrada",
    amount: "42 leads",
    detail: "Origem principal: indicacoes e inbound",
  },
  {
    stage: "Qualificacao",
    amount: "19 oportunidades",
    detail: "Leads com aderencia alta ao produto",
  },
  {
    stage: "Proposta",
    amount: "08 negociacoes",
    detail: "R$ 94 mil em potencial de fechamento",
  },
  {
    stage: "Fechamento",
    amount: "03 contas",
    detail: "2 propostas em revisao final",
  },
] as const;

const crmActions = [
  {
    title: "Novo lead de parceiro",
    subtitle: "Equipe Atlas pediu demonstracao para a proxima semana.",
    icon: UserPlus,
  },
  {
    title: "Follow-up comercial",
    subtitle: "Retomar conversa com a conta Prisma ainda hoje.",
    icon: PhoneCall,
  },
  {
    title: "Atualizar proposta",
    subtitle: "Ajustar escopo do plano enterprise com financeiro.",
    icon: BadgeDollarSign,
  },
] as const;

const contacts = [
  {
    company: "Atlas Energia",
    owner: "Bianca",
    status: "Quente",
    lastTouch: "Hoje, 08:42",
  },
  {
    company: "Prisma Log",
    owner: "Lucas",
    status: "Negociacao",
    lastTouch: "Ontem, 17:15",
  },
  {
    company: "Nova Clin",
    owner: "Carla",
    status: "Descoberta",
    lastTouch: "Ontem, 14:05",
  },
] as const;

export default function DashboardCrmPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-black/5 bg-white/90 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Pipeline CRM</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              Acompanhe leads, negociacoes e proximas interacoes do time.
            </h2>
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
            <Target className="size-5" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pipeline.map((item, index) => (
            <article
              key={item.stage}
              className="rounded-3xl border border-black/5 bg-zinc-50/80 p-5"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Etapa {index + 1}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-zinc-950">
                {item.stage}
              </h3>
              <p className="mt-2 text-sm font-medium text-emerald-700">
                {item.amount}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[32px] border border-black/5 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MessageSquareMore className="size-5 text-emerald-700" />
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
              Fila de acoes do CRM
            </h2>
          </div>

          <div className="mt-6 grid gap-4">
            {crmActions.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-3xl border border-black/5 bg-zinc-50 px-5 py-4"
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[32px] border border-black/5 bg-zinc-950 p-6 text-white shadow-sm">
          <p className="text-sm text-white/60">Relacionamentos recentes</p>
          <div className="mt-5 grid gap-3">
            {contacts.map((contact) => (
              <div
                key={contact.company}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{contact.company}</p>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                    {contact.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/70">
                  Responsavel: {contact.owner}
                </p>
                <p className="text-sm text-white/55">
                  Ultimo contato: {contact.lastTouch}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
