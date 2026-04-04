export type DevStatus =
  | 'Backlog'
  | 'Análise'
  | 'Pronto para Desenvolver'
  | 'Em Desenvolvimento'
  | 'Testes'
  | 'Code Review'
  | 'Concluído';

export type DevType = 'Epic' | 'Feature' | 'Task' | 'Bug';

export type DevUser = {
  id: string;
  name: string;
};

export type DevSprint = {
  id: string;
  name: string;
};

export type DevComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type DevTicket = {
  id: number;
  proto: string;
  title: string;
  category: string;
  devType: DevType;
  devStatus: DevStatus;
  resp: string;
  score: number;
  createdAt: string;
  startDate?: string;
  deadline?: string;
  sprintId?: string;
  parentId?: number;
  clientName?: string;
  description: string;
  comments: DevComment[];
};

export const DEV_COLUMNS: DevStatus[] = [
  'Backlog',
  'Análise',
  'Pronto para Desenvolver',
  'Em Desenvolvimento',
  'Testes',
  'Code Review',
];

export const ALL_DEV_STATUSES: DevStatus[] = [...DEV_COLUMNS, 'Concluído'];

export const DEV_FILTER_TYPES: Array<Exclude<DevType, 'Epic'>> = ['Feature', 'Task', 'Bug'];

export const DEV_CATEGORIES = [
  'Código / Arquitetura',
  'Infraestrutura / DevOps',
  'Integração / API',
  'Segurança',
  'Documentação',
  'Processo / Fluxo',
  'UX / Interface',
  'Performance',
  'Habilis',
  'Meta',
] as const;

export const DEV_USERS: DevUser[] = [
  { id: 'dev-1', name: 'Moara Pereira' },
  { id: 'dev-2', name: 'Ana Souza' },
  { id: 'dev-3', name: 'Bruno Lima' },
  { id: 'dev-4', name: 'Carla Nunes' },
];

export const DEV_SPRINTS: DevSprint[] = [
  { id: 'sp-27', name: 'Sprint 27' },
  { id: 'sp-28', name: 'Sprint 28' },
  { id: 'sp-29', name: 'Sprint 29' },
];

export const INITIAL_DEV_TICKETS: DevTicket[] = [
  {
    id: 4101,
    proto: 'DEV-202604-410101',
    title: 'Epic: revisar o fluxo de protocolos Habilis',
    category: 'Processo / Fluxo',
    devType: 'Epic',
    devStatus: 'Análise',
    resp: 'dev-1',
    score: 11,
    createdAt: '2026-04-01',
    startDate: '2026-04-02',
    deadline: '2026-04-10',
    sprintId: 'sp-28',
    clientName: 'Habilis',
    description:
      'Revisão completa do fluxo de tickets Habilis para eliminar gargalos entre análise, desenvolvimento e entrega.',
    comments: [
      {
        id: 'c-4101-1',
        author: 'Moara Pereira',
        message: 'Mapeei os pontos críticos do fluxo atual e deixei a proposta inicial pronta.',
        createdAt: '01/04/2026 09:12',
      },
    ],
  },
  {
    id: 4102,
    proto: 'DEV-202604-410102',
    title: 'Ajustar validação do protocolo externo no cadastro',
    category: 'Habilis',
    devType: 'Bug',
    devStatus: 'Backlog',
    resp: 'dev-2',
    score: 13,
    createdAt: '2026-04-01',
    deadline: '2026-04-05',
    sprintId: 'sp-28',
    parentId: 4101,
    clientName: 'Habilis',
    description:
      'O campo de protocolo externo está aceitando formatos inválidos e gerando inconsistência na busca global.',
    comments: [
      {
        id: 'c-4102-1',
        author: 'Ana Souza',
        message: 'Bug reproduzido em produção com dois exemplos enviados pelo suporte.',
        createdAt: '01/04/2026 10:40',
      },
      {
        id: 'c-4102-2',
        author: 'Bruno Lima',
        message: 'Sugestão é centralizar a regex no helper compartilhado.',
        createdAt: '01/04/2026 11:08',
      },
    ],
  },
  {
    id: 4103,
    proto: 'DEV-202604-410103',
    title: 'Novo card de resumo para integrações Meta',
    category: 'UX / Interface',
    devType: 'Feature',
    devStatus: 'Pronto para Desenvolver',
    resp: 'dev-3',
    score: 8,
    createdAt: '2026-03-31',
    startDate: '2026-04-03',
    deadline: '2026-04-08',
    sprintId: 'sp-28',
    clientName: 'Meta',
    description:
      'Criar um novo card visual para exibir saúde da integração Meta sem alterar o restante do dashboard.',
    comments: [],
  },
  {
    id: 4104,
    proto: 'DEV-202604-410104',
    title: 'Refatorar envio de anexos no modal de task',
    category: 'Código / Arquitetura',
    devType: 'Task',
    devStatus: 'Em Desenvolvimento',
    resp: 'dev-2',
    score: 6,
    createdAt: '2026-03-30',
    startDate: '2026-04-01',
    deadline: '2026-04-06',
    sprintId: 'sp-28',
    description:
      'Separar a lógica de upload em um util compartilhado para reduzir duplicidade entre modais e detalhes.',
    comments: [
      {
        id: 'c-4104-1',
        author: 'Ana Souza',
        message: 'Estrutura nova já está isolada, faltando só adaptar o fluxo legado.',
        createdAt: '02/04/2026 14:20',
      },
    ],
  },
  {
    id: 4105,
    proto: 'DEV-202604-410105',
    title: 'Corrigir lentidão na busca por protocolo',
    category: 'Performance',
    devType: 'Bug',
    devStatus: 'Testes',
    resp: 'dev-4',
    score: 10,
    createdAt: '2026-03-29',
    startDate: '2026-03-31',
    deadline: '2026-04-04',
    sprintId: 'sp-28',
    clientName: 'Busca Global',
    description:
      'A busca por protocolo apresenta atraso perceptível em bases maiores. Ajuste já foi implementado e aguarda validação.',
    comments: [
      {
        id: 'c-4105-1',
        author: 'Carla Nunes',
        message: 'Teste com massa real ficou dentro do tempo esperado.',
        createdAt: '02/04/2026 17:03',
      },
      {
        id: 'c-4105-2',
        author: 'Moara Pereira',
        message: 'Pendente validar comportamento com filtros combinados.',
        createdAt: '02/04/2026 17:18',
      },
    ],
  },
  {
    id: 4106,
    proto: 'DEV-202604-410106',
    title: 'Padronizar badges de prioridade do kanban',
    category: 'UX / Interface',
    devType: 'Task',
    devStatus: 'Code Review',
    resp: 'dev-3',
    score: 4,
    createdAt: '2026-03-28',
    startDate: '2026-03-29',
    deadline: '2026-04-03',
    sprintId: 'sp-27',
    description:
      'Aplicar a mesma escala visual de prioridade do HTML original em todos os cards do módulo de desenvolvimento.',
    comments: [
      {
        id: 'c-4106-1',
        author: 'Bruno Lima',
        message: 'Pull request aberto e aguardando revisão visual final.',
        createdAt: '02/04/2026 19:11',
      },
    ],
  },
  {
    id: 4107,
    proto: 'DEV-202603-410107',
    title: 'Documentar checklist de deploy do módulo dev',
    category: 'Documentação',
    devType: 'Task',
    devStatus: 'Concluído',
    resp: 'dev-1',
    score: 3,
    createdAt: '2026-03-20',
    startDate: '2026-03-20',
    deadline: '2026-03-22',
    sprintId: 'sp-27',
    description:
      'Checklist finalizado e enviado para o time junto com as observações de homologação.',
    comments: [],
  },
  {
    id: 4108,
    proto: 'DEV-202603-410108',
    title: 'Epic: unificar timeline entre comercial e desenvolvimento',
    category: 'Integração / API',
    devType: 'Epic',
    devStatus: 'Backlog',
    resp: 'dev-1',
    score: 12,
    createdAt: '2026-03-27',
    deadline: '2026-04-15',
    sprintId: 'sp-29',
    clientName: 'CRM',
    description:
      'Projeto estrutural para unificar eventos de comercial e desenvolvimento em uma única timeline compartilhada.',
    comments: [
      {
        id: 'c-4108-1',
        author: 'Moara Pereira',
        message: 'Epic criada para quebrar a entrega em etapas menores nas próximas sprints.',
        createdAt: '28/03/2026 09:00',
      },
    ],
  },
  {
    id: 4109,
    proto: 'DEV-202604-410109',
    title: 'Criar endpoint intermediário para timeline compartilhada',
    category: 'Integração / API',
    devType: 'Feature',
    devStatus: 'Análise',
    resp: 'dev-4',
    score: 9,
    createdAt: '2026-04-02',
    deadline: '2026-04-11',
    sprintId: 'sp-29',
    parentId: 4108,
    clientName: 'CRM',
    description:
      'Primeira entrega da epic, com endpoint intermediário para consolidar eventos das áreas comercial e dev.',
    comments: [],
  },
];
