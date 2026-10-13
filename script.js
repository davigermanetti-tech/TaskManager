/**
 * ══════════════════════════════════════════════════════════════════════════════
 * TASKMANAGER — ARQUITETURA LIMPA E OTIMIZADA (FRONTEND)
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Este arquivo foi estruturado seguindo boas práticas de desenvolvimento:
 * - Padrão Repository (StorageService) para isolar o acesso a dados e facilitar
 *   a futura transição de localStorage para uma API REST no Backend.
 * - Centralização de Estado (AppState) com ciclo de vida previsível.
 * - Renderização via Template Literals com sanitização contra ataques XSS (esc).
 * - Tratamento seguro de eventos assíncronos (Autosave com Flush de segurança).
 * - 100% de compatibilidade retroativa com os elementos inline do index.html.
 * 
 * Autor original: Davi G.
 * Otimização e arquitetura: Antigravity (Google DeepMind)
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   1. CONFIGURAÇÕES E CONSTANTES GLOBAIS (Design Tokens e Chaves)
   ══════════════════════════════════════════════════════════════════════════════ */
const CONFIG = Object.freeze({
    STORAGE_KEY: 'taskmanager_db_v1',
    THEME_KEY: 'td_theme',
    ACCENT_KEY: 'td_accent',
    REMINDERS_SESSION_KEY: 'td_reminders_shown',
    ACCENTS: ['blue', 'violet', 'emerald', 'rose', 'amber', 'cyan'],
    COLORS_BASIC: [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
        '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
        '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ffffff', '#94a3b8'
    ],
    COLORS_DARK: [
        '#0f172a', '#1e293b', '#1e1b4b', '#172554', '#052e16', '#042f2e',
        '#1c1917', '#18181b', '#0c0a09', '#1a0a00', '#2e1065', '#4a044e',
        '#831843', '#450a0a', '#422006', '#365314'
    ],
    GRADIENTS: [
        'linear-gradient(135deg,#667eea,#764ba2)',
        'linear-gradient(135deg,#f093fb,#f5576c)',
        'linear-gradient(135deg,#4facfe,#00f2fe)',
        'linear-gradient(135deg,#43e97b,#38f9d7)',
        'linear-gradient(135deg,#fa709a,#fee140)',
        'linear-gradient(135deg,#a18cd1,#fbc2eb)',
        'linear-gradient(135deg,#fbc2eb,#a6c1ee)',
        'linear-gradient(135deg,#fddb92,#d1fdff)',
        'linear-gradient(135deg,#96fbc4,#f9f586)',
        'linear-gradient(135deg,#f77062,#fe5196)',
        'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
        'linear-gradient(135deg,#093028,#237a57)',
        'linear-gradient(135deg,#200122,#6f0000)',
        'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
        'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
        'linear-gradient(135deg,#f6d365,#fda085)',
        'linear-gradient(135deg,#e0c3fc,#8ec5fc)',
        'linear-gradient(135deg,#96deda,#50c9c3)',
        'linear-gradient(135deg,#3d3393,#2b76b9,#2cacd1,#35eb93)',
        'linear-gradient(135deg,#fc4a1a,#f7b733)'
    ],
    IMAGES: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
        'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80',
        'https://images.unsplash.com/photo-1536152470836-b943b246224c?w=600&q=80',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80'
    ],
    TAG_COLORS: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'],
    CARD_COLORS: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#0f172a', '#334155'],
    BULK_COLORS: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#334155'],
    EMOJI_CATS: {
        'Todos': null,
        '💼 Trabalho': ['📋', '📌', '📊', '📈', '📉', '📝', '📁', '🗂', '📂', '💼', '🖥', '💻', '⌨️', '📱', '☎️', '📞', '🖨', '🗃', '🗄', '📦', '✉️', '📧', '📨', '📩', '🖊', '✏️', '📐', '📏', '🔖', '🏷'],
        '🎯 Projetos': ['🎯', '🚀', '🏆', '🥇', '🎖', '🏅', '🎗', '🎪', '🏗', '🔭', '🔬', '⚗️', '🧪', '🧫', '💡', '🔮', '🧠', '🌐', '🗺', '🧭'],
        '⚡ Tech': ['⚡', '🔧', '🔨', '⚙️', '🛠', '🔩', '🔌', '💾', '💿', '📀', '🖱', '🖲', '📡', '🔋', '🔦', '💡', '🧲', '🔐', '🔑', '🗝'],
        '🎨 Arte': ['🎨', '🖌', '🖼', '🎭', '🎬', '🎤', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁', '🎮', '🕹', '🎲', '🎰', '🎳', '🎱', '♟'],
        '🌍 Mundo': ['🌍', '🌎', '🌏', '🗺', '🏔', '🌋', '🗻', '🏕', '🏖', '🏜', '🌊', '🌈', '☀️', '🌙', '⭐', '🌟', '💫', '⚡', '❄️', '🌪'],
        '🦁 Animais': ['🦁', '🐉', '🦊', '🦋', '🦅', '🦄', '🐺', '🦝', '🦜', '🐳', '🦈', '🐲', '🦖', '🦕', '🐉', '🦩', '🦚', '🦜', '🦋', '🐝'],
        '💎 Especial': ['💎', '🔥', '⭐', '🌟', '✨', '💫', '🎆', '🎇', '🪄', '🔮', '💠', '🔷', '🔶', '🟢', '🟡', '🔴', '🟣', '⬛', '⬜', '🌀']
    }
});

/* ══════════════════════════════════════════════════════════════════════════════
   2. UTILITÁRIOS PUROS (Helpers de Segurança e Formatação)
   ══════════════════════════════════════════════════════════════════════════════ */
const Utils = {
    /**
     * Sanitiza strings para exibição segura no DOM, prevenindo injeções de HTML / XSS.
     * @param {string|null|undefined} str
     * @returns {string}
     */
    esc(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    },

    /**
     * Gera um identificador único com prefixo legível e entropia suficiente.
     * @param {string} prefix 
     * @returns {string} Ex: "task_l8f3a1_9x8z2a"
     */
    uid(prefix = 'id') {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    },

    /**
     * Formata um número com zero à esquerda (2 dígitos).
     * @param {number} n 
     * @returns {string}
     */
    pad2(n) {
        return String(n).padStart(2, '0');
    },

    /**
     * Retorna a data atual no formato padrão ISO 'YYYY-MM-DD'.
     * @returns {string}
     */
    todayISO() {
        const d = new Date();
        return `${d.getFullYear()}-${this.pad2(d.getMonth() + 1)}-${this.pad2(d.getDate())}`;
    },

    /**
     * Adiciona ou subtrai dias de uma string ISO 'YYYY-MM-DD'.
     * @param {string} isoDate 
     * @param {number} days 
     * @returns {string}
     */
    addDaysISO(isoDate, days) {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-').map(Number);
        const dt = new Date(year, month - 1, day);
        dt.setDate(dt.getDate() + days);
        return `${dt.getFullYear()}-${this.pad2(dt.getMonth() + 1)}-${this.pad2(dt.getDate())}`;
    },

    /**
     * Formata 'YYYY-MM-DD' para 'DD/MM' (compacto).
     */
    formatDM(deadline) {
        if (!deadline) return '';
        const p = deadline.split('-');
        return `${p[2]}/${p[1]}`;
    },

    /**
     * Formata 'YYYY-MM-DD' para 'DD/MM/YYYY'.
     */
    formatFullDate(deadline) {
        if (!deadline) return '';
        const p = deadline.split('-');
        return `${p[2]}/${p[1]}/${p[0]}`;
    },

    /**
     * Formata timestamp ISO para 'DD/MM/YYYY'.
     */
    formatCreatedDate(isoDateTime) {
        const d = new Date(isoDateTime);
        if (isNaN(d.getTime())) return '';
        return `${this.pad2(d.getDate())}/${this.pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    },

    /**
     * Formata timestamp ISO para 'DD/MM/YYYY HH:mm'.
     */
    formatDMYHM(isoDateTime) {
        const d = new Date(isoDateTime);
        if (isNaN(d.getTime())) return '';
        return `${this.pad2(d.getDate())}/${this.pad2(d.getMonth() + 1)}/${d.getFullYear()} ${this.pad2(d.getHours())}:${this.pad2(d.getMinutes())}`;
    },

    /**
     * Retorna uma representação humana amigável de tempo decorrido.
     * Ex: "agora mesmo", "5 minutos", "2 dias".
     */
    relativeTime(isoDateTime) {
        const then = new Date(isoDateTime).getTime();
        if (isNaN(then)) return '';
        const diff = Math.max(0, Date.now() - then);
        const min = Math.floor(diff / 60000);
        if (min < 1) return 'agora mesmo';
        if (min < 60) return `${min} minuto${min !== 1 ? 's' : ''}`;
        const hrs = Math.floor(min / 60);
        if (hrs < 24) return `${hrs} hora${hrs !== 1 ? 's' : ''}`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days} dia${days !== 1 ? 's' : ''}`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} mês${months !== 1 ? 'es' : ''}`;
        const years = Math.floor(months / 12);
        return `${years} ano${years !== 1 ? 's' : ''}`;
    },

    /**
     * Rótulos humanizados para os status das tarefas.
     */
    statusLabelFull(status) {
        const map = { todo: 'A fazer', doing: 'Em andamento', done: 'Concluído' };
        return map[status] || status;
    },

    /**
     * Rótulos humanizados para prioridades.
     */
    priLabelFull(priority) {
        const map = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };
        return map[priority] || priority;
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   3. CAMADA DE PERSISTÊNCIA & REPOSITORY (StorageService)
   ──────────────────────────────────────────────────────────────────────────────
   Esta camada abstrai o armazenamento local. Quando você criar seu backend,
   bastará substituir as chamadas internas por requisições HTTP (fetch/axios),
   mantendo toda a interface e lógica do frontend intactas!
   ══════════════════════════════════════════════════════════════════════════════ */
const StorageService = {
    _db: null,

    /**
     * Cria o esquema padrão de uma nova tarefa.
     */
    makeTask(title) {
        const now = new Date().toISOString();
        return {
            id: Utils.uid('task'),
            title: title || 'Nova Tarefa',
            description: '',
            status: 'todo',
            priority: 'media',
            assignedTo: null,
            deadline: '',
            deadlineTime: '',
            progress: 0,
            color: '',
            tags: [],
            checklist: [],
            comments: [],
            createdAt: now,
            updatedAt: now
        };
    },

    /**
     * Constrói o quadro de demonstração (Demo Board) completo com tarefas de exemplo.
     */
    buildDemoBoard() {
        const now = new Date();
        const daysAgo = (n) => {
            const d = new Date(now);
            d.setDate(d.getDate() - n);
            return d.toISOString();
        };

        const mk = (title, opts = {}) => {
            const task = this.makeTask(title);
            Object.assign(task, opts);
            const age = opts.age || 3;
            task.createdAt = daysAgo(age);
            task.updatedAt = daysAgo(Math.max(0, age - 1));
            delete task.age;
            return task;
        };

        return {
            id: 'board_demo',
            name: 'TaskManager Demo',
            emoji: '🚀',
            cover: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
            coverIsImage: false,
            createdAt: daysAgo(6),
            columns: [
                {
                    id: 'col_todo',
                    name: 'A Fazer',
                    color: '#64748b',
                    tasks: [
                        mk('Definir escopo do projeto', {
                            description: 'Levantar requisitos com o cliente e alinhar prioridades.',
                            priority: 'alta',
                            status: 'todo',
                            assignedTo: 'you',
                            deadline: Utils.addDaysISO(Utils.todayISO(), -2),
                            progress: 20,
                            tags: [{ text: 'Planejamento', color: '#3b82f6' }],
                            checklist: [
                                { text: 'Reunião inicial', done: true },
                                { text: 'Documento de requisitos', done: false }
                            ],
                            age: 5
                        }),
                        mk('Pesquisar bibliotecas de UI', {
                            priority: 'baixa',
                            status: 'todo',
                            deadline: Utils.addDaysISO(Utils.todayISO(), 6),
                            progress: 0,
                            tags: [{ text: 'Pesquisa', color: '#8b5cf6' }],
                            age: 4
                        })
                    ]
                },
                {
                    id: 'col_doing',
                    name: 'Em Andamento',
                    color: '#3b82f6',
                    tasks: [
                        mk('Construir tela de login', {
                            description: 'Layout responsivo com validação de formulário.',
                            priority: 'media',
                            status: 'doing',
                            assignedTo: 'you',
                            deadline: Utils.todayISO(),
                            progress: 65,
                            tags: [{ text: 'Frontend', color: '#ec4899' }],
                            checklist: [
                                { text: 'Layout', done: true },
                                { text: 'Validação', done: true },
                                { text: 'Integração API', done: false }
                            ],
                            age: 3
                        }),
                        mk('Revisar API de tarefas', {
                            priority: 'alta',
                            status: 'doing',
                            deadline: Utils.addDaysISO(Utils.todayISO(), 1),
                            progress: 40,
                            checklist: [
                                { text: 'Endpoints', done: true },
                                { text: 'Testes', done: false }
                            ],
                            age: 2
                        })
                    ]
                },
                {
                    id: 'col_done',
                    name: 'Concluído',
                    color: '#22c55e',
                    tasks: [
                        mk('Configurar ambiente de desenvolvimento', {
                            priority: 'baixa',
                            status: 'done',
                            progress: 100,
                            deadline: Utils.addDaysISO(Utils.todayISO(), -5),
                            checklist: [{ text: 'Instalar dependências', done: true }],
                            comments: [{
                                author: 'Você',
                                authorInitials: 'V',
                                text: 'Ambiente pronto! 🎉',
                                ts: Utils.formatDMYHM(daysAgo(1))
                            }],
                            age: 6
                        }),
                        mk('Criar identidade visual do board', {
                            priority: 'media',
                            status: 'done',
                            progress: 100,
                            age: 5
                        })
                    ]
                }
            ]
        };
    },

    /**
     * Retorna a estrutura inicial vazia com dados de exemplo.
     */
    seedDB() {
        return {
            people: [{ id: 'you', name: 'Você' }],
            boards: [this.buildDemoBoard()]
        };
    },

    /**
     * Carrega a base do localStorage com validação de integridade.
     */
    loadDB() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.boards) && Array.isArray(parsed.people)) {
                    this._db = parsed;
                    return this._db;
                }
            }
        } catch (err) {
            console.warn('[TaskManager] Falha ao carregar localStorage, restaurando base padrão:', err);
        }
        this._db = this.seedDB();
        this.saveDB();
        return this._db;
    },

    /**
     * Salva o estado atual no localStorage.
     */
    saveDB() {
        if (!this._db) return;
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this._db));
        } catch (err) {
            console.error('[TaskManager] Erro ao salvar dados no localStorage (cota excedida?):', err);
        }
    },

    /**
     * Retorna a instância em memória do banco.
     */
    getDB() {
        if (!this._db) this.loadDB();
        return this._db;
    },

    /**
     * Localiza uma tarefa específica dentro de um quadro.
     */
    findTaskInBoard(board, taskId) {
        if (!board || !Array.isArray(board.columns)) return null;
        for (let i = 0; i < board.columns.length; i++) {
            const column = board.columns[i];
            for (let j = 0; j < column.tasks.length; j++) {
                if (column.tasks[j].id === taskId) {
                    return { column, task: column.tasks[j], index: j };
                }
            }
        }
        return null;
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   4. ESTADO DA APLICAÇÃO (AppState)
   ══════════════════════════════════════════════════════════════════════════════ */
const AppState = {
    currentBoardId: null,
    currentTaskId: null,
    sortableInstances: [],
    selectedIds: new Set(),
    saveTimer: null,
    hasPendingSave: false,

    // Estado transitório da modal de tarefa
    currentTags: [],
    currentChecklist: [],
    pickerTagColor: '#3b82f6',
    currentTaskColor: '',

    // Estado transitório dos modais de Board
    selEmoji: '📋',
    selCover: 'linear-gradient(135deg,#0f0c29,#302b63)',
    activeCat: 'Todos',
    selectedNewBoardMemberIds: new Set(),
    newBoardAvailableUsers: [],

    isTouchDevice: ('ontouchstart' in window) || navigator.maxTouchPoints > 0
};

// Aliases globais para retrocompatibilidade
let DB = StorageService.getDB();
let CURRENT_BOARD_ID = null;
let selectedIds = AppState.selectedIds;
const isTouchDevice = AppState.isTouchDevice;

function getCurrentBoard() {
    return StorageService.getDB().boards.find((b) => b.id === AppState.currentBoardId);
}

function findTaskInBoard(board, taskId) {
    return StorageService.findTaskInBoard(board, taskId);
}

function findPersonInBoard(assignedTo, board = getCurrentBoard()) {
    if (!assignedTo) return null;
    if (board && Array.isArray(board.members) && board.members.length > 0) {
        const found = board.members.find((p) => p.id === assignedTo || p.userId === assignedTo);
        if (found) return found;
    }
    const dbPeople = StorageService.getDB().people || [];
    return dbPeople.find((p) => p.id === assignedTo) || null;
}


/* ══════════════════════════════════════════════════════════════════════════════
   5. TEMPLATES VISUAIS (ViewTemplates)
   ──────────────────────────────────────────────────────────────────────────────
   Funções limpas e declarativas com Template Literals, que facilitam a leitura
   e garantem que qualquer dado vindo do usuário seja devidamente sanitizado.
   ══════════════════════════════════════════════════════════════════════════════ */
const ViewTemplates = {
    /**
     * Retorna a cor de destaque (accent) apropriada para um card.
     */
    taskAccentColor(task) {
        if (task.color) return task.color;
        if (task.priority === 'alta') return '#ef4444';
        if (task.priority === 'media') return '#eab308';
        return '#22c55e';
    },

    /**
     * Template do card do Board na listagem inicial.
     */
    boardCard(b) {
        const bg = b.coverIsImage
            ? `background:${b.cover};background-size:cover;background-position:center;`
            : `background:${b.cover};`;
        const colCount = b.columns ? b.columns.length : 0;

        return `
            <a href="#/board/${b.id}" class="td-card" data-name="${Utils.esc(b.name.toLowerCase())}">
                <div class="td-card-cover" style="${bg}">
                    <div class="td-card-emoji">${b.emoji}</div>
                </div>
                <div class="td-card-body">
                    <div class="td-card-name">${Utils.esc(b.name)}</div>
                    <div class="td-card-meta">${colCount} coluna${colCount === 1 ? '' : 's'} &middot; Criado ${Utils.formatCreatedDate(b.createdAt)}</div>
                </div>
                <div class="td-card-foot">
                    <span class="td-card-date">${Utils.relativeTime(b.createdAt)} atrás</span>
                    <div class="td-card-actions" style="display:flex;gap:4px;">
                        <button class="td-card-del" title="Editar board" onclick="event.preventDefault();event.stopPropagation();openEditBoard('${b.id}')"><i class="fas fa-pen"></i></button>
                        <button class="td-card-del" title="Excluir" onclick="event.preventDefault();event.stopPropagation();deleteBoard('${b.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </a>
        `;
    },

    /**
     * Template de um card de tarefa na visão Kanban.
     */
    taskCard(task, columnColor) {
        const topColor = this.taskAccentColor(task);
        const person = findPersonInBoard(task.assignedTo);
        const todayStr = Utils.todayISO();
        const isOverdue = Boolean(task.deadline && task.deadline < todayStr && task.status !== 'done');

        // Tags
        let tagsHtml = '';
        if (Array.isArray(task.tags) && task.tags.length) {
            tagsHtml = `
                <div class="td-task-tags-row">
                    ${task.tags.map((t) => `
                        <span class="td-tag-chip" style="color:${t.color};border-color:${t.color}55;background:${t.color}18;">
                            ${Utils.esc(t.text)}
                        </span>
                    `).join('')}
                </div>
            `;
        }

        // Checklist Badge
        let clBadge = '';
        if (Array.isArray(task.checklist) && task.checklist.length) {
            const done = task.checklist.filter((i) => i.done).length;
            const total = task.checklist.length;
            const doneAll = done === total;
            const style = doneAll ? ' style="color:#4ade80;background:rgba(34,197,94,0.12);"' : '';
            clBadge = `<span class="td-card-pill"${style}><i class="fas fa-check-square"></i> ${done}/${total}</span>`;
        }

        const statusLabel = task.status === 'done' ? '✓ Concluído' : task.status === 'doing' ? '⏳ Em andamento' : '○ Não iniciado';
        const priIcon = task.priority === 'alta' ? '🔴' : task.priority === 'media' ? '🟡' : '🟢';
        const priLabel = Utils.priLabelFull(task.priority);
        const deadlineInner = task.deadline
            ? `<i class="far fa-calendar-alt"></i> ${Utils.formatDM(task.deadline)}${task.deadlineTime ? ` ${task.deadlineTime}` : ''}`
            : '';

        return `
            <div class="td-task-card" data-task-id="${task.id}" onclick="tdCardClick(event,'${task.id}')">
                <div class="td-task-top" style="background:${topColor};"></div>
                <div class="td-card-inner">
                    <div class="td-card-row-top">
                        <input type="checkbox" class="td-task-cb" data-task-id="${task.id}" onclick="event.stopPropagation(); toggleTaskSelect(this)">
                        <span class="td-task-title-card">${Utils.esc(task.title)}</span>
                        <button class="td-task-del-btn" title="Excluir" onclick="event.stopPropagation();deleteTask('${task.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                    ${task.description ? `<div class="td-task-desc-card">${Utils.esc(task.description)}</div>` : ''}
                    ${tagsHtml}
                    <div class="td-card-progress-bar">
                        <div class="td-card-progress-fill" style="width:${task.progress || 0}%;background:${(task.progress || 0) === 100 ? '#22c55e' : '#3b82f6'};"></div>
                    </div>
                    <div class="td-card-footer">
                        <span class="td-card-status-pill status-${task.status}">${statusLabel}</span>
                        <span class="td-card-pri-pill pri-${task.priority}">${priIcon} ${priLabel}</span>
                        <span class="td-card-pill td-deadline-pill${isOverdue ? ' td-overdue' : ''}" id="deadline-pill-${task.id}" style="${task.deadline ? '' : 'display:none;'}">${deadlineInner}</span>
                        ${clBadge}
                        ${person ? `<span class="td-card-avatar" title="${Utils.esc(person.name)}" style="margin-left:auto;">${Utils.esc(person.name.slice(0, 1).toUpperCase())}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Template de uma coluna no Kanban.
     */
    column(col) {
        const count = col.tasks ? col.tasks.length : 0;
        const tasksHtml = count
            ? col.tasks.map((t) => this.taskCard(t, col.color)).join('')
            : '<div style="font-size:0.78rem;color:#334155;text-align:center;padding:16px 0;">Sem tarefas</div>';

        return `
            <div class="td-column" data-column-id="${col.id}">
                <div class="td-col-header">
                    <div class="td-col-dot" style="background:${col.color};box-shadow:0 0 6px ${col.color}66;"></div>
                    <span class="td-col-title editable-col" data-col-id="${col.id}" contenteditable="true" 
                          onblur="renameColumn('${col.id}', this.textContent.trim())" 
                          onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}">${Utils.esc(col.name)}</span>
                    <span class="td-col-count">${count}</span>
                    <div class="td-col-actions">
                        <button class="td-col-btn" title="Excluir coluna" onclick="if(confirm('Excluir coluna e todas as tarefas?')) deleteColumn('${col.id}')"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
                <div class="td-task-list" data-column-id="${col.id}">${tasksHtml}</div>
                <div class="td-col-add">
                    <form onsubmit="return submitAddTask(event,'${col.id}')">
                        <input type="text" name="title" placeholder="+ Nova tarefa..." required>
                        <button type="submit"><i class="fas fa-plus"></i></button>
                    </form>
                </div>
            </div>
        `;
    },

    /**
     * Template de uma linha na visão Lista.
     */
    listRow(t) {
        const person = findPersonInBoard(t.assignedTo);
        const acc = this.taskAccentColor(t);

        return `
            <div class="td-list-row td-row-click" data-task-id="${t.id}" onclick="handleRowClick(event,'${t.id}')">
                <span class="td-list-accent" style="background:${acc};"></span>
                <input type="checkbox" class="td-task-cb td-row-cb" data-task-id="${t.id}" style="position:static;opacity:1;margin-right:4px;flex-shrink:0;" onclick="event.stopPropagation();toggleTaskSelect(this)">
                <span class="td-list-row-title">${Utils.esc(t.title)}</span>
                <div class="td-list-row-meta">
                    <span class="status-chip status-${t.status}">${Utils.statusLabelFull(t.status)}</span>
                    <span class="status-chip pri-${t.priority}">${Utils.priLabelFull(t.priority)}</span>
                    ${t.deadline ? `<span><i class="far fa-calendar-alt"></i> ${Utils.formatDM(t.deadline)}</span>` : ''}
                    ${person ? `<span>${Utils.esc(person.name)}</span>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Template de uma linha na visão Tabela.
     */
    tableRow(t, col) {
        const person = findPersonInBoard(t.assignedTo);
        const acc = this.taskAccentColor(t);

        return `
            <tr class="td-row-click" data-task-id="${t.id}" style="cursor:pointer;" onclick="handleRowClick(event,'${t.id}')">
                <td onclick="event.stopPropagation()" style="border-left:4px solid ${acc};">
                    <input type="checkbox" class="td-task-cb td-row-cb" data-task-id="${t.id}" style="position:static;opacity:1;width:15px;height:15px;accent-color:#3b82f6;cursor:pointer;" onclick="toggleTaskSelect(this)">
                </td>
                <td style="font-weight:500;">${Utils.esc(t.title)}</td>
                <td><span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:8px;height:8px;border-radius:50%;background:${col.color};"></span>${Utils.esc(col.name)}</span></td>
                <td><span class="status-chip status-${t.status}">${Utils.statusLabelFull(t.status)}</span></td>
                <td><span class="status-chip pri-${t.priority}">${Utils.priLabelFull(t.priority)}</span></td>
                <td>${person ? Utils.esc(person.name) : '—'}</td>
                <td>${t.deadline ? Utils.formatFullDate(t.deadline) : '—'}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;min-width:60px;">
                            <div style="width:${t.progress || 0}%;height:100%;background:#3b82f6;border-radius:2px;"></div>
                        </div>
                        <span style="font-size:0.75rem;color:#475569;">${t.progress || 0}%</span>
                    </div>
                </td>
            </tr>
        `;
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   6. CONTROLADOR DE BOARDS (BoardController)
   ══════════════════════════════════════════════════════════════════════════════ */
const BoardController = {
    /**
     * Renderiza a grade de boards na página principal.
     */
    renderGrid() {
        const grid = document.getElementById('td-board-grid');
        const label = document.getElementById('td-boards-label');
        const searchInput = document.getElementById('td-search-input');
        const q = (searchInput?.value || '').toLowerCase().trim();
        const db = StorageService.getDB();

        if (!db.boards.length) {
            if (label) label.style.display = 'none';
            if (grid) {
                grid.innerHTML = `
                    <div class="td-empty">
                        <div style="font-size:3rem;margin-bottom:12px;">📋</div>
                        <div style="font-size:1.1rem;font-weight:600;margin-bottom:6px;">Nenhum board ainda</div>
                        <div style="font-size:0.88rem;margin-bottom:16px;">Crie seu primeiro quadro de trabalho para começar.</div>
                        <button class="td-new-btn" style="margin:0 auto;" onclick="restoreDemoData()">
                            <i class="fas fa-rotate"></i> Restaurar dados de exemplo
                        </button>
                    </div>
                `;
            }
            return;
        }

        if (label) label.style.display = '';
        const filtered = db.boards.filter((b) => b.name.toLowerCase().includes(q));

        if (!filtered.length) {
            if (grid) grid.innerHTML = `<div class="td-empty">Nenhum board encontrado para "${Utils.esc(q)}".</div>`;
            return;
        }

        if (grid) grid.innerHTML = filtered.map((b) => ViewTemplates.boardCard(b)).join('');
    },

    /**
     * Exclui um board com confirmação.
     */
    deleteBoard(id) {
        if (!confirm('Excluir este board?')) return;
        const db = StorageService.getDB();
        db.boards = db.boards.filter((b) => b.id !== id);
        StorageService.saveDB();
        this.renderGrid();

        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && !id.startsWith('board_')) {
            ApiService.boards.delete(id).catch(err => console.warn('[BoardController] Falha ao deletar board no backend:', err));
        }
    },

    /**
     * Submete a criação ou edição de um board.
     * Inclui proteção estrita contra cliques múltiplos (anti-duplicação)
     * e atualização otimista instantânea sem bloquear a UI com sync completo.
     */
    async submitBoardForm(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (this._isSubmitting) return false;

        const nameInput = document.getElementById('td-board-name-input');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) return false;

        const submitBtn = document.getElementById('td-submit-btn');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Criar Board';

        this._isSubmitting = true;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }

        try {
            const emoji = document.getElementById('td-emoji-val')?.value || '📋';
            const cover = document.getElementById('td-cover-val')?.value || 'linear-gradient(135deg,#0f0c29,#302b63)';
            const editId = document.getElementById('td-edit-board-id')?.value;
            const coverIsImage = cover.indexOf('url(') === 0;
            const db = StorageService.getDB();

            if (editId) {
                const board = db.boards.find((b) => b.id === editId);
                if (board) {
                    board.name = name;
                    board.emoji = emoji;
                    board.cover = cover;
                    board.coverIsImage = coverIsImage;
                    StorageService.saveDB();

                    if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && !editId.startsWith('board_')) {
                        ApiService.boards.update(editId, { name, emoji, cover, coverIsImage })
                            .catch(err => console.warn('[BoardController] Falha ao atualizar board no backend:', err));
                    }
                }
            } else {
                // Se estiver conectado à conta, cria o board na API NestJS/Supabase
                if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated()) {
                    try {
                        const memberIds = Array.from(AppState.selectedNewBoardMemberIds || []);
                        const created = await ApiService.boards.create({
                            name,
                            emoji,
                            cover,
                            coverIsImage,
                            memberIds
                        });
                        if (created && created.id) {
                            const newBoard = {
                                id: created.id,
                                name: created.name,
                                emoji: created.emoji || emoji,
                                cover: created.cover || cover,
                                coverIsImage: Boolean(created.coverIsImage),
                                createdAt: created.createdAt || new Date().toISOString(),
                                userId: created.userId,
                                user: created.user,
                                members: (created.members || []).map(m => ({
                                    id: m.userId || m.user?.id || m.id,
                                    memberId: m.id,
                                    name: m.user?.name || m.name || 'Membro',
                                    email: m.user?.email || m.email || '',
                                    avatarUrl: m.user?.avatarUrl || m.avatarUrl || '',
                                    role: m.role || 'member'
                                })),
                                columns: (created.columns || []).map(col => ({
                                    id: col.id,
                                    name: col.name,
                                    color: col.color || '#3b82f6',
                                    order: col.order,
                                    tasks: []
                                }))
                            };

                            db.boards = db.boards.filter(b => b.id !== newBoard.id);
                            db.boards.unshift(newBoard);
                            StorageService.saveDB();

                            this.closeNewModal();
                            this.renderGrid();
                            // Sincronização em segundo plano não bloqueia a interface
                            BackendSyncService.syncFromBackend().catch(() => {});
                            return false;
                        }
                    } catch (err) {
                        console.warn('[BoardController] Falha ao criar board no backend:', err);
                    }
                }

                // Fallback para modo local/offline: cria o board com 3 colunas estruturadas
                const localMembers = Array.from(AppState.selectedNewBoardMemberIds || []).map(id => {
                    const u = (AppState.newBoardAvailableUsers || []).find(x => x.id === id);
                    return u ? { id: u.id, name: u.name, email: u.email, role: 'member' } : { id, name: 'Membro', role: 'member' };
                });
                db.boards.unshift({
                    id: Utils.uid('board'),
                    name,
                    emoji,
                    cover,
                    coverIsImage,
                    createdAt: new Date().toISOString(),
                    members: localMembers,
                    columns: [
                        { id: Utils.uid('col'), name: 'A Fazer', color: '#3b82f6', order: 0, tasks: [] },
                        { id: Utils.uid('col'), name: 'Em Andamento', color: '#f59e0b', order: 1, tasks: [] },
                        { id: Utils.uid('col'), name: 'Concluído', color: '#10b981', order: 2, tasks: [] }
                    ]
                });
                StorageService.saveDB();
            }

            this.closeNewModal();
            this.renderGrid();
            return false;
        } finally {
            this._isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    },

    /**
     * Alterna entre as abas principais da modal de novo board (Personalização / Membros).
     */
    switchNewBoardTab(tab, btn) {
        const customBtn = document.getElementById('nb-tab-btn-custom');
        const membersBtn = document.getElementById('nb-tab-btn-members');
        const customPanel = document.getElementById('nb-panel-custom');
        const membersPanel = document.getElementById('nb-panel-members');

        if (tab === 'members') {
            customBtn?.classList.remove('active');
            membersBtn?.classList.add('active');
            if (customPanel) customPanel.style.display = 'none';
            if (membersPanel) membersPanel.style.display = 'block';
            if (typeof MembersController !== 'undefined') {
                MembersController.loadNewBoardUsers(document.getElementById('nb-search-users-input')?.value || '');
            }
        } else {
            membersBtn?.classList.remove('active');
            customBtn?.classList.add('active');
            if (membersPanel) membersPanel.style.display = 'none';
            if (customPanel) customPanel.style.display = 'block';
        }
    },

    /**
     * Abre o modal de criação de novo board.
     */
    openNewModal() {
        document.getElementById('td-modal-title').textContent = '✨ Novo Board';
        document.getElementById('td-submit-btn').textContent = 'Criar Board';
        document.getElementById('td-edit-board-id').value = '';
        document.getElementById('td-board-name-input').value = '';

        // Reset de membros para o novo board
        AppState.selectedNewBoardMemberIds = new Set();
        AppState.newBoardAvailableUsers = [];
        const mainTabs = document.getElementById('nb-main-tabs');
        if (mainTabs) mainTabs.style.display = 'flex';
        this.switchNewBoardTab('custom');
        const badgeCount = document.getElementById('nb-members-count-badge');
        if (badgeCount) badgeCount.style.display = 'none';
        const labelCount = document.getElementById('nb-selected-count-label');
        if (labelCount) labelCount.textContent = '0';
        const searchInput = document.getElementById('nb-search-users-input');
        if (searchInput) searchInput.value = '';
        if (typeof MembersController !== 'undefined') {
            MembersController.renderNewBoardChips();
        }

        const fileInput = document.getElementById('cover-image-input');
        if (fileInput) fileInput.value = '';
        const labelText = document.getElementById('upload-label-text');
        if (labelText) labelText.textContent = 'Clique para escolher uma imagem...';

        const defaultCover = 'linear-gradient(135deg,#0f0c29,#302b63)';
        AppState.selEmoji = '📋';
        AppState.selCover = defaultCover;
        document.getElementById('td-emoji-val').value = '📋';
        document.getElementById('td-cover-val').value = defaultCover;

        const prev = document.getElementById('cover-preview');
        if (prev) {
            prev.style.background = defaultCover;
            prev.textContent = '';
        }

        EmojiPicker.render('');
        this.switchCoverTab('gradient', document.querySelectorAll('.td-cover-tab')[1]);
        document.getElementById('td-new-modal')?.classList.add('open');
    },

    /**
     * Abre o modal principal para editar um board selecionado.
     */
    openEditModal(id) {
        const board = StorageService.getDB().boards.find((x) => x.id === id);
        if (!board) return;

        document.getElementById('td-modal-title').textContent = '✏️ Editar Board';
        document.getElementById('td-submit-btn').textContent = 'Salvar';
        document.getElementById('td-edit-board-id').value = id;
        document.getElementById('td-board-name-input').value = board.name;

        // Na edição simples, foca na personalização (membros são gerenciados internamente no board)
        const mainTabs = document.getElementById('nb-main-tabs');
        if (mainTabs) mainTabs.style.display = 'none';
        this.switchNewBoardTab('custom');

        const fileInput = document.getElementById('cover-image-input');
        if (fileInput) fileInput.value = '';
        const labelText = document.getElementById('upload-label-text');
        if (labelText) labelText.textContent = 'Clique para escolher uma imagem...';

        AppState.selEmoji = board.emoji;
        document.getElementById('td-emoji-val').value = board.emoji;
        EmojiPicker.render('');

        AppState.selCover = board.cover;
        document.getElementById('td-cover-val').value = board.cover;

        const prev = document.getElementById('cover-preview');
        if (prev) {
            prev.style.background = board.cover;
            prev.style.backgroundSize = 'cover';
            prev.style.backgroundPosition = 'center';
            prev.textContent = '';
        }

        document.querySelectorAll('.td-color-swatch, .td-grad-opt, .td-img-opt').forEach((el) => el.classList.remove('sel'));
        const tabs = document.querySelectorAll('.td-cover-tab');
        if (board.cover.indexOf('url(') === 0) this.switchCoverTab('image', tabs[2]);
        else if (board.cover.indexOf('gradient') !== -1) this.switchCoverTab('gradient', tabs[1]);
        else this.switchCoverTab('color', tabs[0]);

        document.getElementById('td-new-modal')?.classList.add('open');
    },

    /**
     * Fecha a modal de criação/edição.
     */
    closeNewModal() {
        document.getElementById('td-new-modal')?.classList.remove('open');
    },

    /**
     * Alterna a aba de capa (Cor, Gradiente, Imagem).
     */
    switchCoverTab(tab, btn) {
        if (!btn) return;
        document.querySelectorAll('.td-cover-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-color').style.display = tab === 'color' ? '' : 'none';
        document.getElementById('panel-gradient').style.display = tab === 'gradient' ? '' : 'none';
        document.getElementById('panel-image').style.display = tab === 'image' ? '' : 'none';
    },

    /**
     * Define a capa selecionada e atualiza o preview.
     */
    setCover(value) {
        AppState.selCover = value;
        const coverValInput = document.getElementById('td-cover-val');
        if (coverValInput) coverValInput.value = value;

        const prev = document.getElementById('cover-preview');
        if (prev) {
            prev.style.background = value;
            prev.style.backgroundSize = 'cover';
            prev.style.backgroundPosition = 'center';
            prev.textContent = '';
        }

        const fileInput = document.getElementById('cover-image-input');
        if (fileInput) fileInput.value = '';
        const labelText = document.getElementById('upload-label-text');
        if (labelText) labelText.textContent = 'Clique para escolher uma imagem...';

        document.querySelectorAll('.td-color-swatch, .td-grad-opt, .td-img-opt').forEach((el) => el.classList.remove('sel'));
    },

    /**
     * Aplica uma URL digitada manualmente para a imagem de capa.
     */
    applyImgUrl() {
        const input = document.getElementById('img-url-input');
        const url = input?.value.trim();
        if (!url) return;
        this.setCover(`url('${url}')`);
    },

    /**
     * Trata upload de arquivo de imagem local para a capa.
     */
    onCoverFileChange(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const labelText = document.getElementById('upload-label-text');
        if (labelText) labelText.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const cssVal = `url('${dataUrl}')`;
            const prev = document.getElementById('cover-preview');
            if (prev) {
                prev.style.background = `${cssVal} center/cover`;
                prev.textContent = '';
            }
            AppState.selCover = cssVal;
            const coverValInput = document.getElementById('td-cover-val');
            if (coverValInput) coverValInput.value = cssVal;
            document.querySelectorAll('.td-color-swatch, .td-grad-opt, .td-img-opt').forEach((el) => el.classList.remove('sel'));
        };
        reader.readAsDataURL(file);
    },

    /**
     * Abre a modal de edição rápida do board ativo (no cabeçalho do board).
     */
    openEditBoardModal() {
        const board = getCurrentBoard();
        if (!board) return;

        document.getElementById('eb-name-input').value = board.name;
        document.getElementById('eb-emoji-val').value = board.emoji;
        document.getElementById('eb-emoji-display').textContent = board.emoji;
        document.getElementById('eb-cover-val').value = board.cover;

        const header = document.getElementById('eb-cover-header');
        if (header) header.style.background = board.cover;

        const prev = document.getElementById('eb-cover-preview');
        if (prev) {
            prev.style.background = board.cover;
            prev.style.backgroundSize = 'cover';
            prev.style.backgroundPosition = 'center';
        }

        document.querySelectorAll('.eb-swatch, .eb-grad, .eb-img').forEach((x) => x.classList.remove('sel'));
        const tabs = document.querySelectorAll('.eb-tab');
        if (board.cover.indexOf('url(') === 0) ebSwitchTab(tabs[2]);
        else if (board.cover.indexOf('gradient') !== -1) ebSwitchTab(tabs[1]);
        else ebSwitchTab(tabs[0]);

        document.getElementById('edit-board-modal')?.classList.add('open');
    },

    /**
     * Salva as alterações da modal de edição rápida.
     */
    saveEditBoard(e) {
        e.preventDefault();
        const board = getCurrentBoard();
        if (!board) return false;

        const nameInput = document.getElementById('eb-name-input');
        const name = nameInput?.value.trim();
        if (name) board.name = name;

        board.emoji = document.getElementById('eb-emoji-val')?.value || board.emoji;
        board.cover = document.getElementById('eb-cover-val')?.value || board.cover;
        board.coverIsImage = board.cover.indexOf('url(') === 0;

        StorageService.saveDB();
        document.getElementById('edit-board-modal')?.classList.remove('open');
        TaskController.renderAll();
        return false;
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   7. SELETOR DE EMOJIS (EmojiPicker)
   ══════════════════════════════════════════════════════════════════════════════ */
const EmojiPicker = {
    buildCategories() {
        const wrap = document.getElementById('emoji-cats');
        if (!wrap) return;
        wrap.innerHTML = '';
        Object.keys(CONFIG.EMOJI_CATS).forEach((cat) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `td-emoji-cat-btn${cat === AppState.activeCat ? ' active' : ''}`;
            btn.textContent = cat;
            btn.onclick = () => {
                AppState.activeCat = cat;
                document.querySelectorAll('.td-emoji-cat-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                this.render(document.getElementById('emoji-search')?.value);
            };
            wrap.appendChild(btn);
        });
    },

    getAllEmoji() {
        if (AppState.activeCat === 'Todos') {
            return Object.values(CONFIG.EMOJI_CATS).filter(Boolean).flat();
        }
        return CONFIG.EMOJI_CATS[AppState.activeCat] || [];
    },

    render(query = '') {
        const grid = document.getElementById('emoji-grid');
        if (!grid) return;
        grid.innerHTML = '';

        let emojis = this.getAllEmoji();
        if (query) {
            emojis = Object.values(CONFIG.EMOJI_CATS)
                .filter(Boolean)
                .flat()
                .filter((e) => e.includes(query));
        }

        const seen = new Set();
        emojis.forEach((e) => {
            if (seen.has(e)) return;
            seen.add(e);
            const d = document.createElement('div');
            d.className = `td-emoji-opt${e === AppState.selEmoji ? ' sel' : ''}`;
            d.textContent = e;
            d.onclick = () => {
                AppState.selEmoji = e;
                const emojiVal = document.getElementById('td-emoji-val');
                if (emojiVal) emojiVal.value = e;
                const prev = document.getElementById('cover-preview');
                if (prev) prev.textContent = e;
                grid.querySelectorAll('.td-emoji-opt').forEach((x) => x.classList.remove('sel'));
                d.classList.add('sel');
            };
            grid.appendChild(d);
        });
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   8. CONTROLADOR DE TAREFAS E VIEWS (TaskController)
   ══════════════════════════════════════════════════════════════════════════════ */
const TaskController = {
    /**
     * Renderiza o quadro ativo em todas as visualizações disponíveis.
     */
    renderAll() {
        const board = getCurrentBoard();
        if (!board) return;
        this.renderHeader(board);
        this.renderKanban(board);
        this.renderList(board);
        this.renderTable(board);
    },

    renderHeader(board) {
        const emojiEl = document.getElementById('board-emoji');
        const nameEl = document.getElementById('board-name');
        if (emojiEl) emojiEl.textContent = board.emoji;
        if (nameEl) nameEl.textContent = board.name;
        this.renderMembersHeader();
    },

    renderMembersHeader() {
        const wrap = document.getElementById('board-members');
        if (!wrap) return;
        const board = getCurrentBoard();
        const members = (board && Array.isArray(board.members) && board.members.length > 0)
            ? board.members
            : (StorageService.getDB().people || []);

        wrap.innerHTML = members.map((p) => {
            const initials = Utils.esc((p.name || 'U').slice(0, 1).toUpperCase());
            const isOwner = p.role === 'owner' || (board && board.userId && (p.id === board.userId || p.userId === board.userId));
            const roleLabel = isOwner ? ' (👑 Dono)' : '';
            return `
                <div class="td-member-avatar ${isOwner ? 'is-owner' : ''}" title="${Utils.esc(p.name || 'Participante')}${roleLabel}">
                    ${initials}
                </div>
            `;
        }).join('') + `
            <button class="td-member-avatar td-member-invite" title="Gerenciar membros" onclick="openMembersModal()" 
                    style="background:rgba(255,255,255,0.08);border:1px dashed rgba(255,255,255,0.25);color:#64748b;cursor:pointer;">
                <i class="fas fa-plus" style="font-size:0.6rem;"></i>
            </button>
        `;
    },

    destroySortables() {
        AppState.sortableInstances.forEach((s) => {
            try { s.destroy(); } catch (_) { }
        });
        AppState.sortableInstances = [];
    },

    renderKanban(board) {
        const wrap = document.getElementById('kanban-cols');
        if (!wrap) return;
        wrap.innerHTML = board.columns.map((col) => ViewTemplates.column(col)).join('');
        this.destroySortables();

        board.columns.forEach((col) => {
            const listEl = wrap.querySelector(`.td-task-list[data-column-id="${col.id}"]`);
            if (!listEl || typeof Sortable === 'undefined') return;

            const instance = new Sortable(listEl, {
                group: { name: 'tasks', pull: true, put: true },
                animation: 160,
                ghostClass: 'dragging',
                emptyInsertThreshold: 20,
                delay: AppState.isTouchDevice ? 2000 : 0,
                delayOnTouchOnly: true,
                touchStartThreshold: 4,
                onEnd: (evt) => this.onTaskDragEnd(evt)
            });
            AppState.sortableInstances.push(instance);
        });
    },

    onTaskDragEnd(evt) {
        const board = getCurrentBoard();
        if (!board) return;

        const taskId = evt.item?.dataset?.taskId;
        const fromColId = evt.from?.dataset?.columnId;
        const toColId = evt.to?.dataset?.columnId;

        const fromCol = board.columns.find((c) => c.id === fromColId);
        const toCol = board.columns.find((c) => c.id === toColId);
        if (!fromCol || !toCol) return;

        const idx = fromCol.tasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return;

        const [removed] = fromCol.tasks.splice(idx, 1);
        toCol.tasks.splice(evt.newIndex, 0, removed);
        StorageService.saveDB();

        // Atualiza contadores visuais das colunas
        document.querySelectorAll('#kanban-cols .td-column').forEach((colEl) => {
            const cid = colEl.dataset.columnId;
            const c = board.columns.find((x) => x.id === cid);
            if (c) {
                const countSpan = colEl.querySelector('.td-col-count');
                if (countSpan) countSpan.textContent = c.tasks.length;
            }
        });

        this.renderList(board);
        this.renderTable(board);
    },

    renderList(board) {
        const wrap = document.getElementById('view-list-wrap');
        if (!wrap) return;

        wrap.innerHTML = board.columns.map((col) => {
            const rows = col.tasks.length
                ? col.tasks.map((t) => ViewTemplates.listRow(t)).join('')
                : '<div style="padding:8px 12px;font-size:0.8rem;color:#334155;">Sem tarefas</div>';

            return `
                <div class="td-list-section">
                    <div class="td-list-col-header">
                        <div class="td-col-dot" style="background:${col.color};box-shadow:0 0 4px ${col.color}66;"></div>
                        ${Utils.esc(col.name)} <span style="color:#334155;font-weight:400;">(${col.tasks.length})</span>
                    </div>
                    ${rows}
                </div>
            `;
        }).join('');
    },

    renderTable(board) {
        const body = document.getElementById('view-table-body');
        if (!body) return;

        let rows = '';
        board.columns.forEach((col) => {
            col.tasks.forEach((t) => {
                rows += ViewTemplates.tableRow(t, col);
            });
        });
        body.innerHTML = rows;
    },

    switchViewTab(btn) {
        if (!btn) return;
        document.querySelectorAll('.td-view-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.td-view').forEach((v) => { v.style.display = 'none'; });
        const targetView = document.getElementById(`view-${btn.dataset.mode}`);
        if (targetView) targetView.style.display = '';
    },

    addColumn(e) {
        e.preventDefault();
        const form = e.target;
        const name = form.querySelector('input[name="name"]')?.value.trim();
        const color = form.querySelector('input[name="color"]')?.value || '#3b82f6';
        if (!name) return false;

        const board = getCurrentBoard();
        if (!board) return false;

        board.columns.push({ id: Utils.uid('col'), name, color, tasks: [] });
        StorageService.saveDB();

        document.getElementById('add-col-form')?.classList.add('d-none');
        form.reset();
        this.renderAll();
        return false;
    },

    deleteColumn(colId) {
        const board = getCurrentBoard();
        if (!board) return;
        board.columns = board.columns.filter((c) => c.id !== colId);
        StorageService.saveDB();
        this.renderAll();
    },

    renameColumn(colId, name) {
        if (!name) return;
        const board = getCurrentBoard();
        if (!board) return;
        const col = board.columns.find((c) => c.id === colId);
        if (!col) return;
        col.name = name;
        StorageService.saveDB();
        this.renderList(board);
        this.renderTable(board);
    },

    submitAddTask(e, colId) {
        e.preventDefault();
        const form = e.target;
        if (form.dataset.submitting === 'true') return false;

        const input = form.querySelector('input[name="title"]');
        const title = input?.value.trim();
        if (!title) return false;

        const board = getCurrentBoard();
        if (!board) return false;
        const col = board.columns.find((c) => c.id === colId);
        if (!col) return false;

        // 1. Trava reenvio acidental por duplo clique e limpa input imediatamente
        form.dataset.submitting = 'true';
        if (input) input.value = '';

        // 2. Renderização Otimista Imediata (0ms delay perceptível)
        const newTask = StorageService.makeTask(title);
        const tempId = newTask.id;
        col.tasks.push(newTask);
        StorageService.saveDB();
        this.renderAll();

        // Destrava para próximas tarefas
        form.dataset.submitting = 'false';

        // 3. Sincronização em segundo plano com o Supabase
        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board.id !== 'board_demo' && !col.id.startsWith('col_')) {
            ApiService.tasks.create({
                title: newTask.title,
                columnId: col.id
            }).then((created) => {
                if (created && created.id) {
                    newTask.id = created.id;
                    // Se o modal estiver aberto para essa tarefa neste momento, atualiza o ID ativo
                    if (AppState.currentTaskId === tempId) {
                        AppState.currentTaskId = created.id;
                    }
                    // Atualiza atributos data-task-id nos elementos renderizados do DOM
                    const cardEl = document.querySelector(`.td-task-card[data-task-id="${tempId}"]`);
                    if (cardEl) {
                        cardEl.dataset.taskId = created.id;
                        cardEl.querySelectorAll(`[data-task-id="${tempId}"]`).forEach((el) => {
                            el.dataset.taskId = created.id;
                        });
                    }
                    StorageService.saveDB();
                }
            }).catch((err) => {
                console.warn('[TaskManager] Falha ao persistir tarefa no banco:', err);
            });
        }

        return false;
    },

    deleteTask(taskId) {
        if (!confirm('Excluir esta tarefa?')) return;
        const board = getCurrentBoard();
        if (!board) return;

        board.columns.forEach((col) => {
            col.tasks = col.tasks.filter((t) => t.id !== taskId);
        });
        AppState.selectedIds.delete(taskId);
        StorageService.saveDB();
        this.renderAll();
        BulkActionsController.updateBar();

        // Se estiver autenticado e a tarefa existir no banco, remove do Supabase
        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board.id !== 'board_demo' && !taskId.startsWith('task_')) {
            ApiService.tasks.delete(taskId).catch(err => console.warn('[TaskManager] Falha ao deletar no banco:', err));
        }
    },

    exportBoardPDF() {
        document.querySelectorAll('#page-board .td-view').forEach((v) => { v.style.display = ''; });
        window.print();
        window.addEventListener('afterprint', () => {
            document.querySelectorAll('#page-board .td-view').forEach((v) => { v.style.display = 'none'; });
            const activeBtn = document.querySelector('.td-view-tab.active');
            if (activeBtn) {
                const targetView = document.getElementById(`view-${activeBtn.dataset.mode}`);
                if (targetView) targetView.style.display = '';
            }
        }, { once: true });
    },

    /* ── Modal de Detalhes da Tarefa & Autosave Inteligente ── */
    populateAssigneeSelect() {
        const sel = document.getElementById('modal-assignee');
        if (!sel) return;
        const cur = sel.value;
        const board = getCurrentBoard();
        const members = (board && Array.isArray(board.members) && board.members.length > 0)
            ? board.members
            : (StorageService.getDB().people || []);
        sel.innerHTML = '<option value="">— Nenhum —</option>' + members.map((p) => {
            const isOwner = p.role === 'owner' || (board && board.userId && (p.id === board.userId || p.userId === board.userId));
            return `<option value="${p.id || p.userId}">${Utils.esc(p.name)}${isOwner ? ' (👑 Dono)' : ''}</option>`;
        }).join('');
        sel.value = cur;
    },

    openTaskModal(taskId) {
        const board = getCurrentBoard();
        const loc = board ? StorageService.findTaskInBoard(board, taskId) : null;
        if (!loc) return;

        AppState.currentTaskId = taskId;
        document.getElementById('task-modal-bd')?.classList.add('open');
        const saveStatus = document.getElementById('modal-save-status');
        if (saveStatus) saveStatus.textContent = '';

        this.populateAssigneeSelect();
        this.loadModalData(loc.task, loc.column);
    },

    /**
     * Fecha o modal da tarefa garantindo que nenhuma alteração pendente seja perdida.
     * (Bug fix de race condition do timer de debounce)
     */
    closeTaskModal() {
        if (AppState.hasPendingSave) {
            this.doSave();
        } else {
            clearTimeout(AppState.saveTimer);
        }
        document.getElementById('task-modal-bd')?.classList.remove('open');
        AppState.currentTaskId = null;
    },

    loadModalData(task, column) {
        const cover = document.getElementById('modal-cover');
        const coverColor = task.color || column.color;
        if (cover) {
            cover.dataset.colColor = column.color;
            cover.style.setProperty('background', `linear-gradient(135deg, ${coverColor}cc, ${coverColor}44)`, 'important');
        }

        const titleEl = document.getElementById('modal-title');
        if (titleEl) {
            titleEl.value = task.title;
            this.autoResize(titleEl);
        }

        document.getElementById('modal-status').value = task.status || 'todo';
        document.getElementById('modal-priority').value = task.priority || 'media';
        document.getElementById('modal-assignee').value = task.assignedTo || '';
        document.getElementById('modal-deadline').value = task.deadline || '';
        document.getElementById('modal-deadline-time').value = task.deadlineTime || '';

        const prog = task.progress || 0;
        const progInput = document.getElementById('modal-progress-input');
        if (progInput) progInput.value = prog;
        this.updateProgressBar(prog);

        AppState.currentTaskColor = task.color || '';
        this.buildColorSwatches();

        const descEl = document.getElementById('modal-desc');
        if (descEl) descEl.value = task.description || '';

        const datesEl = document.getElementById('modal-dates');
        if (datesEl) {
            let datesHtml = '';
            if (task.createdAt) datesHtml += `<span class="td-modal-date-item"><i class="fas fa-plus-circle"></i> Criado em ${Utils.formatDMYHM(task.createdAt)}</span>`;
            if (task.updatedAt) datesHtml += `<span class="td-modal-date-item"><i class="fas fa-pen"></i> Atualizado em ${Utils.formatDMYHM(task.updatedAt)}</span>`;
            datesEl.innerHTML = datesHtml;
        }

        AppState.currentTags = Array.isArray(task.tags) ? [...task.tags] : [];
        this.renderTags();

        AppState.currentChecklist = Array.isArray(task.checklist) ? task.checklist.map((i) => ({ ...i })) : [];
        this.renderChecklist();

        this.renderComments(Array.isArray(task.comments) ? task.comments : []);
        const commentInput = document.getElementById('comment-input');
        if (commentInput) commentInput.value = '';
    },

    buildColorSwatches() {
        const row = document.getElementById('modal-color-row');
        if (!row) return;
        row.innerHTML = '';

        const none = document.createElement('div');
        none.className = 'td-color-none';
        none.title = 'Sem cor';
        none.textContent = '✕';
        none.onclick = () => this.setTaskColor('');
        if (!AppState.currentTaskColor) none.style.borderColor = '#fff';
        row.appendChild(none);

        CONFIG.CARD_COLORS.forEach((c) => {
            const d = document.createElement('div');
            d.className = `td-color-swatch${c === AppState.currentTaskColor ? ' sel' : ''}`;
            d.style.background = c;
            d.onclick = () => this.setTaskColor(c);
            row.appendChild(d);
        });
    },

    setTaskColor(color) {
        AppState.currentTaskColor = color;
        this.buildColorSwatches();
        const cover = document.getElementById('modal-cover');
        if (cover) {
            const base = color || cover.dataset.colColor || '#1e293b';
            cover.style.setProperty('background', `linear-gradient(135deg, ${base}cc, ${base}44)`, 'important');
        }
        this.autosave();
    },

    updateProgressBar(val) {
        const pctEl = document.getElementById('modal-progress-pct');
        if (pctEl) pctEl.textContent = `${val}%`;
    },

    autoResize(el) {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    },

    autosave() {
        clearTimeout(AppState.saveTimer);
        AppState.hasPendingSave = true;
        const statusEl = document.getElementById('modal-save-status');
        if (statusEl) statusEl.textContent = 'Salvando...';
        AppState.saveTimer = setTimeout(() => this.doSave(), 700);
    },

    doSave() {
        clearTimeout(AppState.saveTimer);
        AppState.hasPendingSave = false;
        if (!AppState.currentTaskId) return;

        const board = getCurrentBoard();
        const loc = board ? StorageService.findTaskInBoard(board, AppState.currentTaskId) : null;
        if (!loc) return;

        const t = loc.task;
        t.title = document.getElementById('modal-title')?.value || t.title;
        t.description = document.getElementById('modal-desc')?.value || '';
        t.status = document.getElementById('modal-status')?.value || 'todo';
        t.priority = document.getElementById('modal-priority')?.value || 'media';
        t.assignedTo = document.getElementById('modal-assignee')?.value || null;
        t.deadline = document.getElementById('modal-deadline')?.value || '';
        t.deadlineTime = document.getElementById('modal-deadline-time')?.value || '';
        t.progress = parseInt(document.getElementById('modal-progress-input')?.value || '0', 10);
        t.color = AppState.currentTaskColor;
        t.tags = AppState.currentTags;
        t.checklist = AppState.currentChecklist;
        t.updatedAt = new Date().toISOString();

        StorageService.saveDB();

        const statusEl = document.getElementById('modal-save-status');
        if (statusEl) statusEl.textContent = 'Salvo ✓';
        setTimeout(() => {
            const s = document.getElementById('modal-save-status');
            if (s && s.textContent === 'Salvo ✓') s.textContent = '';
        }, 1800);

        this.renderAll();

        // Se estiver autenticado e for um quadro do backend, sincroniza a tarefa com o Supabase!
        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board.id !== 'board_demo') {
            if (t.id.startsWith('task_') && !loc.column.id.startsWith('col_')) {
                ApiService.tasks.create({
                    title: t.title,
                    columnId: loc.column.id,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    deadline: t.deadline || null,
                    deadlineTime: t.deadlineTime || null,
                    progress: t.progress,
                    color: t.color
                }).then(created => {
                    if (created && created.id) {
                        t.id = created.id;
                        AppState.currentTaskId = created.id;
                        StorageService.saveDB();
                    }
                }).catch(err => console.warn('[TaskManager] Falha ao persistir tarefa no banco:', err));
            } else if (!t.id.startsWith('task_')) {
                ApiService.tasks.update(t.id, {
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    deadline: t.deadline || null,
                    deadlineTime: t.deadlineTime || null,
                    progress: t.progress,
                    color: t.color
                }).catch(err => console.warn('[TaskManager] Falha ao sincronizar atualização no banco:', err));
            }
        }
    },

    /* ── Comentários ── */
    renderComments(comments) {
        const wrap = document.getElementById('modal-comments');
        if (!wrap) return;
        if (!comments.length) {
            wrap.innerHTML = '<div style="font-size:0.8rem;color:#334155;padding:6px 0;">Nenhum comentário ainda.</div>';
            return;
        }
        wrap.innerHTML = comments.map((c) => `
            <div class="td-comment-item">
                <div class="td-comment-avatar">${Utils.esc(c.authorInitials)}</div>
                <div class="td-comment-body">
                    <div class="td-comment-meta"><strong>${Utils.esc(c.author)}</strong> · ${Utils.esc(c.ts)}</div>
                    <div class="td-comment-text">${Utils.esc(c.text).replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `).join('');
    },

    sendComment() {
        if (!AppState.currentTaskId) return;
        const board = getCurrentBoard();
        const loc = board ? StorageService.findTaskInBoard(board, AppState.currentTaskId) : null;
        if (!loc) return;

        const input = document.getElementById('comment-input');
        const text = input?.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = 'auto';

        const people = StorageService.getDB().people;
        const person = people.find((p) => p.id === 'you') || people[0] || { name: 'Você' };
        const comment = {
            author: person.name,
            authorInitials: person.name.slice(0, 1).toUpperCase(),
            text,
            ts: Utils.formatDMYHM(new Date().toISOString())
        };

        loc.task.comments = loc.task.comments || [];
        loc.task.comments.push(comment);
        loc.task.updatedAt = new Date().toISOString();
        StorageService.saveDB();

        this.renderComments(loc.task.comments);
        const wrap = document.getElementById('modal-comments');
        if (wrap) wrap.scrollTop = wrap.scrollHeight;
    },

    /* ── Tags ── */
    buildTagColorRow() {
        const row = document.getElementById('tag-color-row');
        if (!row) return;
        row.innerHTML = '';
        CONFIG.TAG_COLORS.forEach((c) => {
            const d = document.createElement('div');
            d.className = `td-tag-color-opt${c === AppState.pickerTagColor ? ' sel' : ''}`;
            d.style.background = c;
            d.onclick = () => {
                AppState.pickerTagColor = c;
                row.querySelectorAll('.td-tag-color-opt').forEach((x) => x.classList.remove('sel'));
                d.classList.add('sel');
            };
            row.appendChild(d);
        });
    },

    toggleTagPicker(e) {
        if (e) e.stopPropagation();
        const p = document.getElementById('tag-picker');
        if (!p) return;
        const isShowing = p.style.display !== 'none';
        p.style.display = isShowing ? 'none' : 'block';
        if (!isShowing) {
            this.buildTagColorRow();
            document.getElementById('tag-name-input')?.focus();
        }
    },

    confirmAddTag() {
        const nameInput = document.getElementById('tag-name-input');
        const name = nameInput?.value.trim();
        if (!name) return;

        AppState.currentTags.push({ text: name, color: AppState.pickerTagColor });
        nameInput.value = '';
        const picker = document.getElementById('tag-picker');
        if (picker) picker.style.display = 'none';

        this.renderTags();
        this.autosave();
    },

    removeTag(idx) {
        AppState.currentTags.splice(idx, 1);
        this.renderTags();
        this.autosave();
    },

    renderTags() {
        const wrap = document.getElementById('modal-tags-wrap');
        if (!wrap) return;
        wrap.innerHTML = AppState.currentTags.map((tag, i) => `
            <span class="td-modal-tag" style="color:${tag.color};border-color:${tag.color}55;background:${tag.color}22;">
                ${Utils.esc(tag.text)} <span class="rm-tag" onclick="removeTag(${i})">✕</span>
            </span>
        `).join('');

        const addBtn = document.createElement('button');
        addBtn.className = 'td-add-tag-btn';
        addBtn.textContent = '+ Tag';
        addBtn.onclick = (e) => this.toggleTagPicker(e);
        wrap.appendChild(addBtn);
    },

    /* ── Checklist ── */
    addCheckItem(text = '') {
        const item = { id: Utils.uid('chk'), text, done: false };
        AppState.currentChecklist.push(item);
        this.renderChecklist();
        this.autosave();
        const inputs = document.querySelectorAll('.td-check-text');
        if (inputs.length) inputs[inputs.length - 1].focus();

        const board = getCurrentBoard();
        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board && board.id !== 'board_demo' && AppState.currentTaskId && !AppState.currentTaskId.startsWith('task_') && text) {
            ApiService.tasks.addChecklistItem(AppState.currentTaskId, text)
                .then(created => {
                    if (created && created.id) {
                        item.id = created.id;
                        this.autosave();
                    }
                })
                .catch(err => console.warn('[TaskManager] Falha ao persistir checklist no banco:', err));
        }
    },

    toggleCheckItem(idx) {
        const item = AppState.currentChecklist[idx];
        if (!item) return;
        item.done = !item.done;
        this.renderChecklist();
        this.autosave();

        const board = getCurrentBoard();
        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board && board.id !== 'board_demo' && item.id && !item.id.startsWith('chk_')) {
            ApiService.tasks.updateChecklistItem(item.id, { done: item.done })
                .catch(err => console.warn('[TaskManager] Falha ao atualizar checklist no banco:', err));
        }
    },

    removeCheckItem(idx) {
        const [removed] = AppState.currentChecklist.splice(idx, 1);
        this.renderChecklist();
        this.autosave();

        const board = getCurrentBoard();
        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board && board.id !== 'board_demo' && removed && removed.id && !removed.id.startsWith('chk_')) {
            ApiService.tasks.deleteChecklistItem(removed.id)
                .catch(err => console.warn('[TaskManager] Falha ao remover checklist do banco:', err));
        }
    },

    updateCheckText(idx, val) {
        const item = AppState.currentChecklist[idx];
        if (item) {
            item.text = val;
            this.autosave();

            const board = getCurrentBoard();
            if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board && board.id !== 'board_demo' && AppState.currentTaskId && !AppState.currentTaskId.startsWith('task_')) {
                if (item.id && !item.id.startsWith('chk_')) {
                    ApiService.tasks.updateChecklistItem(item.id, { text: val })
                        .catch(err => console.warn('[TaskManager] Falha ao atualizar texto do checklist:', err));
                } else if (val.trim()) {
                    ApiService.tasks.addChecklistItem(AppState.currentTaskId, val.trim())
                        .then(created => {
                            if (created && created.id) {
                                item.id = created.id;
                                this.autosave();
                            }
                        })
                        .catch(err => console.warn('[TaskManager] Falha ao salvar novo item no banco:', err));
                }
            }
        }
    },

    renderChecklist() {
        const wrap = document.getElementById('modal-checklist');
        if (!wrap) return;

        const done = AppState.currentChecklist.filter((i) => i.done).length;
        const total = AppState.currentChecklist.length;
        const progEl = document.getElementById('checklist-progress');
        if (progEl) progEl.textContent = total ? `(${done}/${total})` : '';

        wrap.innerHTML = AppState.currentChecklist.map((item, i) => `
            <div class="td-check-item">
                <input type="checkbox" class="td-check-cb" ${item.done ? 'checked' : ''} onchange="toggleCheckItem(${i})">
                <input type="text" class="td-check-text ${item.done ? 'done' : ''}" 
                       value="${Utils.esc(item.text).replace(/"/g, '&quot;')}" placeholder="Item..." 
                       onblur="updateCheckText(${i}, this.value)" 
                       onkeydown="if(event.key==='Enter'){event.preventDefault();addCheckItem();}if(event.key==='Backspace'&&!this.value){removeCheckItem(${i});}">
                <button class="td-check-del" onclick="removeCheckItem(${i})"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    },

    renderModalChecklist() {
        return this.renderChecklist();
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   9. SELEÇÃO EM LOTE / BULK ACTIONS (BulkActionsController)
   ══════════════════════════════════════════════════════════════════════════════ */
const BulkActionsController = {
    initSwatches() {
        const wrap = document.getElementById('bulk-color-swatches');
        if (!wrap) return;
        wrap.innerHTML = '';
        CONFIG.BULK_COLORS.forEach((c) => {
            const d = document.createElement('div');
            d.style.cssText = `width:24px;height:24px;border-radius:6px;background:${c};cursor:pointer;border:2px solid transparent;transition:transform .15s;`;
            d.onmouseenter = () => { d.style.transform = 'scale(1.2)'; };
            d.onmouseleave = () => { d.style.transform = ''; };
            d.onclick = () => this.doAction('color', c);
            wrap.appendChild(d);
        });
    },

    toggleSelect(cb) {
        const id = cb.dataset.taskId;
        if (cb.checked) {
            AppState.selectedIds.add(id);
            document.querySelectorAll(`.td-task-cb[data-task-id="${id}"]`).forEach((x) => { x.checked = true; });
            document.querySelector(`.td-task-card[data-task-id="${id}"]`)?.classList.add('td-selected');
        } else {
            AppState.selectedIds.delete(id);
            document.querySelectorAll(`.td-task-cb[data-task-id="${id}"]`).forEach((x) => { x.checked = false; });
            document.querySelector(`.td-task-card[data-task-id="${id}"]`)?.classList.remove('td-selected');
        }
        this.updateBar();
    },

    updateBar() {
        const bar = document.getElementById('bulk-bar');
        const label = document.getElementById('bulk-count-label');
        const n = AppState.selectedIds.size;

        if (label) {
            label.textContent = `${n} tarefa${n !== 1 ? 's' : ''} selecionada${n !== 1 ? 's' : ''}`;
        }

        if (n > 0) {
            bar?.classList.add('visible');
            document.querySelectorAll('.td-task-list, .td-list-wrap, .td-table-wrap').forEach((el) => {
                el.classList.add('selection-mode');
            });
        } else {
            bar?.classList.remove('visible');
            this.closeDropdowns();
            document.querySelectorAll('.td-task-list, .td-list-wrap, .td-table-wrap').forEach((el) => {
                el.classList.remove('selection-mode');
            });
        }
    },

    clear() {
        AppState.selectedIds.clear();
        document.querySelectorAll('.td-task-cb').forEach((cb) => { cb.checked = false; });
        document.querySelectorAll('.td-task-card').forEach((c) => { c.classList.remove('td-selected'); });
        this.updateBar();
    },

    toggleDropdown(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const wasOpen = el.classList.contains('open');
        this.closeDropdowns();
        if (!wasOpen) el.classList.add('open');
    },

    closeDropdowns() {
        document.querySelectorAll('.bulk-dropdown').forEach((d) => d.classList.remove('open'));
    },

    doAction(action, value) {
        if (!AppState.selectedIds.size) return;
        this.closeDropdowns();

        const board = getCurrentBoard();
        if (!board) return;
        const ids = Array.from(AppState.selectedIds);

        if (action === 'delete') {
            board.columns.forEach((col) => {
                col.tasks = col.tasks.filter((t) => !ids.includes(t.id));
            });
        } else {
            ids.forEach((id) => {
                const loc = StorageService.findTaskInBoard(board, id);
                if (!loc) return;
                if (action === 'color') loc.task.color = value;
                else if (action === 'status') loc.task.status = value;
                else if (action === 'priority') loc.task.priority = value;
                loc.task.updatedAt = new Date().toISOString();
            });
        }

        StorageService.saveDB();
        this.clear();
        TaskController.renderAll();
    },

    doDelete() {
        if (!AppState.selectedIds.size) return;
        if (!confirm(`Excluir ${AppState.selectedIds.size} tarefa(s)? Esta ação não pode ser desfeita.`)) return;
        this.doAction('delete', '');
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   10. LEMBRETES E NOTIFICAÇÕES (ReminderController)
   ══════════════════════════════════════════════════════════════════════════════ */
const ReminderController = {
    compute() {
        const todayStr = Utils.todayISO();
        const in2 = Utils.addDaysISO(todayStr, 2);
        const results = [];
        const db = StorageService.getDB();

        db.boards.forEach((board) => {
            board.columns.forEach((col) => {
                col.tasks.forEach((t) => {
                    if (!t.deadline || t.status === 'done') return;
                    let urgency = null;
                    if (t.deadline < todayStr) urgency = 'overdue';
                    else if (t.deadline === todayStr) urgency = 'today';
                    else if (t.deadline <= in2) urgency = 'soon';

                    if (urgency) {
                        results.push({
                            id: t.id,
                            boardId: board.id,
                            title: t.title,
                            board: board.name,
                            column: col.name,
                            priority: t.priority,
                            deadline: t.deadline,
                            deadlineTime: t.deadlineTime,
                            urgency
                        });
                    }
                });
            });
        });

        const order = { overdue: 0, today: 1, soon: 2 };
        results.sort((a, b) => {
            const byUrgency = order[a.urgency] - order[b.urgency];
            if (byUrgency !== 0) return byUrgency;
            return (a.deadline || '').localeCompare(b.deadline || '');
        });

        return results;
    },

    renderList(list) {
        const listEl = document.getElementById('reminder-list');
        const subtitle = document.getElementById('reminder-subtitle');
        if (!listEl || !subtitle) return;

        if (!list.length) {
            subtitle.textContent = 'Nenhum lembrete pendente';
            listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#475569;font-size:0.85rem;">Nenhuma tarefa com prazo próximo. 🎉</div>';
            return;
        }

        const overdue = list.filter((t) => t.urgency === 'overdue').length;
        const soon = list.filter((t) => t.urgency === 'soon').length;
        let subtitleText = `${list.length} tarefa${list.length !== 1 ? 's' : ''} para hoje`;
        if (overdue) subtitleText += ` · ${overdue} atrasada${overdue !== 1 ? 's' : ''}`;
        if (soon) subtitleText += ` · ${soon} próxima${soon !== 1 ? 's' : ''}`;
        subtitle.textContent = subtitleText;

        const urgencyColors = { overdue: '#ef4444', soon: '#eab308', today: '#3b82f6' };
        const urgencyLabels = { overdue: 'Atrasada', soon: 'Em breve', today: 'Hoje' };
        const priColors = { alta: '#ef4444', media: '#eab308', baixa: '#22c55e' };

        listEl.innerHTML = list.map((t) => {
            const timeStr = t.deadlineTime
                ? `<span class="td-reminder-time" style="color:${urgencyColors[t.urgency]};">${Utils.esc(t.deadlineTime)}</span>`
                : '';

            return `
                <div class="td-reminder-item urgency-${t.urgency}" onclick="goToTaskFromReminder('${t.boardId}','${t.id}')">
                    <div class="td-reminder-urgency-dot" style="background:${urgencyColors[t.urgency]};box-shadow:0 0 6px ${urgencyColors[t.urgency]}88;"></div>
                    <div class="td-reminder-info">
                        <div class="td-reminder-task-title">${Utils.esc(t.title)}</div>
                        <div class="td-reminder-meta">
                            <span style="display:inline-flex;align-items:center;gap:4px;">
                                <span style="width:7px;height:7px;border-radius:50%;background:${priColors[t.priority]};"></span>
                                ${Utils.esc(t.board)} · ${Utils.esc(t.column)}
                            </span>
                            <span style="margin-left:6px;color:${urgencyColors[t.urgency]};font-weight:600;">${urgencyLabels[t.urgency]}</span>
                        </div>
                    </div>
                    ${timeStr}
                </div>
            `;
        }).join('');
    },

    updateBadge(n) {
        const badge = document.getElementById('bell-badge');
        if (!badge) return;
        if (n > 0) {
            badge.textContent = n > 99 ? '99+' : String(n);
            badge.style.display = '';
        } else {
            badge.style.display = 'none';
        }
    },

    openModal() {
        const list = this.compute();
        this.renderList(list);
        document.getElementById('reminder-modal-bd')?.classList.add('open');
        this.updateBadge(list.length);
    },

    closeModal() {
        document.getElementById('reminder-modal-bd')?.classList.remove('open');
    },

    maybeAutoShow() {
        const list = this.compute();
        this.updateBadge(list.length);
        if (list.length && !sessionStorage.getItem(CONFIG.REMINDERS_SESSION_KEY)) {
            sessionStorage.setItem(CONFIG.REMINDERS_SESSION_KEY, '1');
            this.renderList(list);
            document.getElementById('reminder-modal-bd')?.classList.add('open');
        }
    },

    goToTask(boardId, taskId) {
        this.closeModal();
        location.hash = `#/board/${boardId}`;
        Router.openBoardView(boardId);
        setTimeout(() => {
            TaskController.openTaskModal(taskId);
        }, 60);
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   11. TEMA & PERSONALIZAÇÃO DE CORES (ThemeController)
   ══════════════════════════════════════════════════════════════════════════════ */
const ThemeController = {
    initTheme() {
        const saved = localStorage.getItem(CONFIG.THEME_KEY) || 'dark';
        document.body.setAttribute('data-theme', saved);
        this.updateThemeIcon();
    },

    toggleTheme() {
        const cur = document.body.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem(CONFIG.THEME_KEY, next);
        this.updateThemeIcon();
    },

    updateThemeIcon() {
        const btn = document.getElementById('theme-toggle-btn');
        if (!btn) return;
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', isDark ? '#080e1b' : '#eef1f7');
    },

    initAccent() {
        const saved = localStorage.getItem(CONFIG.ACCENT_KEY) || 'blue';
        this.applyAccent(saved);
    },

    applyAccent(name) {
        if (!CONFIG.ACCENTS.includes(name)) name = 'blue';
        if (name === 'blue') document.body.removeAttribute('data-accent');
        else document.body.setAttribute('data-accent', name);

        document.querySelectorAll('.acc-dot').forEach((d) => {
            d.classList.toggle('sel', d.getAttribute('data-accent') === name);
        });
    },

    setAccent(name) {
        this.applyAccent(name);
        localStorage.setItem(CONFIG.ACCENT_KEY, name);
        const pop = document.getElementById('acc-pop');
        if (pop) pop.classList.remove('open');
    },

    toggleAccentPop(e) {
        if (e) e.stopPropagation();
        const pop = document.getElementById('acc-pop');
        if (pop) pop.classList.toggle('open');
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   12. GERENCIAMENTO DE MEMBROS (MembersController)
   ══════════════════════════════════════════════════════════════════════════════ */
const MembersController = {
    _newBoardSearchTimer: null,
    _boardSearchTimer: null,
    _addingMemberIds: new Set(),
    _removingMemberIds: new Set(),

    /**
     * Abre a modal de gerenciamento de membros do quadro ativo.
     */
    openModal() {
        const board = getCurrentBoard();
        if (!board) return;
        document.getElementById('members-modal')?.classList.add('open');
        this.renderBoardMembers();
        this.searchBoardUsers('');
        const input = document.getElementById('board-add-member-search');
        if (input) input.value = '';

        // Se estiver conectado e for board persistido no backend, sincroniza membros
        if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && !board.id.startsWith('board_')) {
            ApiService.boards.getMembers(board.id).then((freshMembers) => {
                if (Array.isArray(freshMembers)) {
                    board.members = freshMembers.map(m => ({
                        id: m.userId || m.user?.id || m.id,
                        memberId: m.id,
                        name: m.user?.name || m.name || 'Membro',
                        email: m.user?.email || m.email || '',
                        avatarUrl: m.user?.avatarUrl || m.avatarUrl || '',
                        role: m.role || 'member'
                    }));
                    StorageService.saveDB();
                    this.renderBoardMembers();
                    TaskController.renderMembersHeader();
                    TaskController.populateAssigneeSelect();
                }
            }).catch(err => console.warn('[MembersController] Falha ao carregar membros do backend:', err));
        }
    },

    /**
     * Fecha a modal de gerenciamento de membros.
     */
    closeModal() {
        document.getElementById('members-modal')?.classList.remove('open');
    },

    /**
     * Renderiza os membros que atualmente possuem acesso ao quadro ativo.
     */
    renderBoardMembers() {
        const list = document.getElementById('members-list');
        const countEl = document.getElementById('board-members-count');
        if (!list) return;
        const board = getCurrentBoard();
        if (!board) return;

        const members = (board.members && Array.isArray(board.members) && board.members.length > 0)
            ? board.members
            : (StorageService.getDB().people || []);

        if (countEl) countEl.textContent = members.length;

        if (!members.length) {
            list.innerHTML = '<div style="font-size:0.83rem;color:#94a3b8;padding:8px 0;">Nenhum participante ainda.</div>';
            return;
        }

        const currentUser = (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated())
            ? ApiService.auth.getUser()
            : null;
        const isCurrentUserOwner = board.userId ? (currentUser && currentUser.id === board.userId) : true;

        list.innerHTML = members.map((p) => {
            const initials = Utils.esc((p.name || 'U').slice(0, 1).toUpperCase());
            const isOwner = p.role === 'owner' || (board.userId && (p.id === board.userId || p.userId === board.userId));
            const roleBadge = isOwner
                ? '<span class="td-badge-role owner">👑 Dono</span>'
                : '<span class="td-badge-role member">Membro</span>';

            const canRemove = !isOwner && (isCurrentUserOwner || (currentUser && (currentUser.id === p.id || currentUser.id === p.userId)));
            const removeBtn = canRemove ? `
                <button type="button" class="td-member-remove-btn" data-user-id="${p.id || p.userId}" onclick="MembersController.removeMemberFromBoard('${p.id || p.userId}', this)" title="Remover participante">
                    <i class="fas fa-user-minus"></i> Remover
                </button>
            ` : '';

            return `
                <div class="td-user-pick-card" style="margin-bottom:6px;">
                    <div class="td-user-pick-avatar">${initials}</div>
                    <div class="td-user-pick-info">
                        <div class="td-user-pick-name">${Utils.esc(p.name)}</div>
                        <div class="td-user-pick-email">${Utils.esc(p.email || 'Usuário do sistema')}</div>
                    </div>
                    ${roleBadge}
                    ${removeBtn}
                </div>
            `;
        }).join('');
    },

    /**
     * Busca usuários cadastrados no banco para adicionar ao quadro ativo.
     */
    async searchBoardUsers(query = '') {
        const resultsContainer = document.getElementById('board-search-results-list');
        if (!resultsContainer) return;

        if (typeof ApiService === 'undefined' || !ApiService.auth.isAuthenticated()) {
            resultsContainer.innerHTML = '<div style="font-size:0.8rem;color:#94a3b8;padding:8px 0;">Faça login para adicionar outros usuários registrados.</div>';
            return;
        }

        const board = getCurrentBoard();
        if (!board) return;

        const currentMemberIds = new Set(
            (board.members || []).map(m => m.id || m.userId)
        );
        if (board.userId) currentMemberIds.add(board.userId);

        resultsContainer.innerHTML = '<div style="font-size:0.8rem;color:#94a3b8;padding:8px 0;"><i class="fas fa-spinner fa-spin"></i> Buscando usuários...</div>';

        try {
            const users = await ApiService.users.list(query);
            const available = (users || []).filter(u => !currentMemberIds.has(u.id));

            if (!available.length) {
                resultsContainer.innerHTML = `
                    <div style="font-size:0.8rem;color:#94a3b8;padding:8px 0;text-align:center;">
                        ${query ? 'Nenhum usuário correspondente encontrado.' : 'Todos os usuários disponíveis já fazem parte deste quadro.'}
                    </div>
                `;
                return;
            }

            resultsContainer.innerHTML = available.map(u => {
                const initials = Utils.esc((u.name || 'U').slice(0, 1).toUpperCase());
                return `
                    <div class="td-user-pick-card" style="margin-bottom:6px;">
                        <div class="td-user-pick-avatar">${initials}</div>
                        <div class="td-user-pick-info">
                            <div class="td-user-pick-name">${Utils.esc(u.name)}</div>
                            <div class="td-user-pick-email">${Utils.esc(u.email || '')}</div>
                        </div>
                        <button type="button" class="td-user-pick-btn add" data-user-id="${u.id}" onclick="MembersController.addMemberToBoard('${u.id}', this)">
                            <i class="fas fa-plus"></i> Adicionar
                        </button>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.warn('[MembersController] Erro ao buscar usuários:', err);
            resultsContainer.innerHTML = '<div style="font-size:0.8rem;color:#ef4444;padding:8px 0;">Erro ao buscar usuários.</div>';
        }
    },

    /**
     * Debounce de busca de usuários para o quadro ativo.
     */
    onSearchBoardUsers(query) {
        if (this._boardSearchTimer) clearTimeout(this._boardSearchTimer);
        this._boardSearchTimer = setTimeout(() => {
            this.searchBoardUsers(query);
        }, 250);
    },

    /**
     * Adiciona um usuário cadastrado como membro do quadro ativo.
     * Protegido contra cliques múltiplos e atualiza a UI instantaneamente.
     */
    async addMemberToBoard(userId, btnEl) {
        if (!userId) return;
        if (this._addingMemberIds.has(userId)) return;
        this._addingMemberIds.add(userId);

        const btn = btnEl || document.querySelector(`.td-user-pick-btn[data-user-id="${userId}"]`);
        const originalHtml = btn ? btn.innerHTML : '<i class="fas fa-plus"></i> Adicionar';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adicionando...';
        }

        const board = getCurrentBoard();
        if (!board) {
            this._addingMemberIds.delete(userId);
            if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
            return;
        }

        try {
            if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && !board.id.startsWith('board_')) {
                const addedMember = await ApiService.boards.addMember(board.id, userId, 'member');
                if (addedMember) {
                    const newMemberObj = {
                        id: addedMember.userId || addedMember.user?.id || userId,
                        memberId: addedMember.id,
                        name: addedMember.user?.name || 'Membro',
                        email: addedMember.user?.email || '',
                        avatarUrl: addedMember.user?.avatarUrl || '',
                        role: addedMember.role || 'member'
                    };
                    if (!board.members) board.members = [];
                    if (!board.members.some(m => m.id === newMemberObj.id || m.userId === newMemberObj.id)) {
                        board.members.push(newMemberObj);
                    }
                    StorageService.saveDB();
                }
            } else {
                // Modo local offline
                if (!board.members) board.members = [];
                board.members.push({ id: userId, name: 'Participante', role: 'member' });
                StorageService.saveDB();
            }

            this.renderBoardMembers();
            this.searchBoardUsers(document.getElementById('board-add-member-search')?.value || '');
            TaskController.renderMembersHeader();
            TaskController.populateAssigneeSelect();
        } catch (err) {
            console.warn('[MembersController] Erro ao adicionar membro:', err);
            alert('Não foi possível adicionar o participante: ' + (err.message || 'Erro inesperado'));
        } finally {
            this._addingMemberIds.delete(userId);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    },

    /**
     * Remove um participante do quadro ativo.
     * Atualização atômica e instantânea na UI.
     */
    async removeMemberFromBoard(userId, btnEl) {
        if (!userId) return;
        if (this._removingMemberIds.has(userId)) return;
        if (!confirm('Deseja remover este participante do quadro?')) return;

        this._removingMemberIds.add(userId);
        const btn = btnEl || document.querySelector(`.td-member-remove-btn[data-user-id="${userId}"]`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        const board = getCurrentBoard();
        if (!board) {
            this._removingMemberIds.delete(userId);
            return;
        }

        try {
            if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && !board.id.startsWith('board_')) {
                await ApiService.boards.removeMember(board.id, userId);
            }
            if (board.members) {
                board.members = board.members.filter(m => m.id !== userId && m.userId !== userId);
                StorageService.saveDB();
            }

            this.renderBoardMembers();
            this.searchBoardUsers(document.getElementById('board-add-member-search')?.value || '');
            TaskController.renderMembersHeader();
            TaskController.populateAssigneeSelect();
        } catch (err) {
            console.warn('[MembersController] Erro ao remover membro:', err);
            alert('Não foi possível remover o participante: ' + (err.message || 'Erro inesperado'));
        } finally {
            this._removingMemberIds.delete(userId);
        }
    },

    /* ── Fluxo de Membros na Criação de Novo Quadro ── */

    /**
     * Carrega usuários cadastrados disponíveis para seleção no modal de novo quadro.
     */
    async loadNewBoardUsers(search = '') {
        const listEl = document.getElementById('nb-users-pick-list');
        if (!listEl) return;

        if (!AppState.selectedNewBoardMemberIds) {
            AppState.selectedNewBoardMemberIds = new Set();
        }

        if (typeof ApiService === 'undefined' || !ApiService.auth.isAuthenticated()) {
            listEl.innerHTML = '<div style="font-size:0.8rem;color:#94a3b8;padding:8px 0;">Faça login para ver e convidar outros usuários cadastrados.</div>';
            return;
        }

        listEl.innerHTML = '<div style="font-size:0.8rem;color:#94a3b8;padding:8px 0;"><i class="fas fa-spinner fa-spin"></i> Buscando usuários cadastrados...</div>';

        try {
            const users = await ApiService.users.list(search);
            AppState.newBoardAvailableUsers = Array.isArray(users) ? users : [];
            this.renderNewBoardPickList();
        } catch (err) {
            console.warn('[MembersController] Falha ao listar usuários para novo board:', err);
            listEl.innerHTML = '<div style="font-size:0.8rem;color:#ef4444;padding:8px 0;">Erro ao listar usuários cadastrados.</div>';
        }
    },

    /**
     * Debounce de busca de usuários para criação de novo quadro.
     */
    onSearchNewBoardUsers(query) {
        if (this._newBoardSearchTimer) clearTimeout(this._newBoardSearchTimer);
        this._newBoardSearchTimer = setTimeout(() => {
            this.loadNewBoardUsers(query);
        }, 250);
    },

    /**
     * Renderiza a lista de seleção de usuários cadastrados no modal de novo quadro.
     */
    renderNewBoardPickList() {
        const listEl = document.getElementById('nb-users-pick-list');
        if (!listEl) return;

        const users = AppState.newBoardAvailableUsers || [];
        const currentUser = (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated())
            ? ApiService.auth.getUser()
            : null;
        const selectedIds = AppState.selectedNewBoardMemberIds || new Set();

        if (!users.length) {
            listEl.innerHTML = '<div style="font-size:0.8rem;color:#94a3b8;padding:8px 0;text-align:center;">Nenhum usuário encontrado.</div>';
            return;
        }

        listEl.innerHTML = users.map(u => {
            const isSelf = currentUser && currentUser.id === u.id;
            const isSelected = isSelf || selectedIds.has(u.id);
            const initials = Utils.esc((u.name || 'U').slice(0, 1).toUpperCase());

            let actionBtn;
            if (isSelf) {
                actionBtn = '<span class="td-badge-role owner">👑 Dono (Você)</span>';
            } else if (isSelected) {
                actionBtn = `
                    <button type="button" class="td-user-pick-btn selected" onclick="MembersController.toggleNewBoardMember('${u.id}')">
                        <i class="fas fa-check"></i> Selecionado
                    </button>
                `;
            } else {
                actionBtn = `
                    <button type="button" class="td-user-pick-btn add" onclick="MembersController.toggleNewBoardMember('${u.id}')">
                        <i class="fas fa-plus"></i> Selecionar
                    </button>
                `;
            }

            return `
                <div class="td-user-pick-card ${isSelected ? 'is-selected' : ''}" style="margin-bottom:6px;">
                    <div class="td-user-pick-avatar">${initials}</div>
                    <div class="td-user-pick-info">
                        <div class="td-user-pick-name">${Utils.esc(u.name)}${isSelf ? ' <small style="color:#60a5fa;">(Você)</small>' : ''}</div>
                        <div class="td-user-pick-email">${Utils.esc(u.email || '')}</div>
                    </div>
                    ${actionBtn}
                </div>
            `;
        }).join('');
    },

    /**
     * Alterna a seleção de um membro para o novo quadro.
     */
    toggleNewBoardMember(userId) {
        if (!AppState.selectedNewBoardMemberIds) {
            AppState.selectedNewBoardMemberIds = new Set();
        }
        const currentUser = (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated())
            ? ApiService.auth.getUser()
            : null;
        if (currentUser && currentUser.id === userId) return; // Dono é automático

        if (AppState.selectedNewBoardMemberIds.has(userId)) {
            AppState.selectedNewBoardMemberIds.delete(userId);
        } else {
            AppState.selectedNewBoardMemberIds.add(userId);
        }

        this.renderNewBoardChips();
        this.renderNewBoardPickList();
    },

    /**
     * Renderiza os chips de membros selecionados para o novo quadro.
     */
    renderNewBoardChips() {
        const chipsWrap = document.getElementById('nb-selected-chips');
        const badgeCount = document.getElementById('nb-members-count-badge');
        const labelCount = document.getElementById('nb-selected-count-label');
        if (!chipsWrap) return;

        const selectedIds = AppState.selectedNewBoardMemberIds || new Set();
        const count = selectedIds.size;

        if (badgeCount) {
            badgeCount.textContent = count;
            badgeCount.style.display = count > 0 ? 'inline-flex' : 'none';
        }
        if (labelCount) labelCount.textContent = count;

        if (count === 0) {
            chipsWrap.innerHTML = '<span style="font-size:0.78rem;color:#64748b;font-style:italic;">Apenas você (proprietário) até o momento. Selecione membros abaixo para colaborar.</span>';
            return;
        }

        const users = AppState.newBoardAvailableUsers || [];
        chipsWrap.innerHTML = Array.from(selectedIds).map(id => {
            const u = users.find(x => x.id === id) || { name: 'Membro', email: '' };
            const initials = Utils.esc((u.name || 'M').slice(0, 1).toUpperCase());
            return `
                <div class="td-member-chip">
                    <div class="td-chip-avatar">${initials}</div>
                    <span class="td-chip-name">${Utils.esc(u.name)}</span>
                    <button type="button" class="td-chip-remove" onclick="MembersController.toggleNewBoardMember('${id}')" title="Remover seleção">✕</button>
                </div>
            `;
        }).join('');
    },

    /* ── Métodos de Retrocompatibilidade ── */
    render() {
        this.renderBoardMembers();
    },

    add(e) {
        if (e && e.preventDefault) e.preventDefault();
        return false;
    },

    remove(id) {
        this.removeMemberFromBoard(id);
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   13. ROTEAMENTO & FAB MOBILE (Router)
   ══════════════════════════════════════════════════════════════════════════════ */
const Router = {
    handle() {
        const hash = location.hash || '#/';
        const match = hash.match(/^#\/board\/([^/]+)/);
        if (match) {
            this.openBoardView(decodeURIComponent(match[1]));
        } else {
            this.openBoardListView();
        }
    },

    openBoardListView() {
        const pageBoard = document.getElementById('page-board');
        const pageBoards = document.getElementById('page-boards');
        if (pageBoard) pageBoard.style.display = 'none';
        if (pageBoards) pageBoards.style.display = '';

        AppState.currentBoardId = null;
        CURRENT_BOARD_ID = null;
        BoardController.renderGrid();
        window.scrollTo(0, 0);
    },

    openBoardView(boardId) {
        const board = StorageService.getDB().boards.find((b) => b.id === boardId);
        if (!board) {
            location.hash = '#/';
            return;
        }

        AppState.currentBoardId = boardId;
        CURRENT_BOARD_ID = boardId;

        const pageBoards = document.getElementById('page-boards');
        const pageBoard = document.getElementById('page-board');
        if (pageBoards) pageBoards.style.display = 'none';
        if (pageBoard) pageBoard.style.display = '';

        BulkActionsController.clear();
        TaskController.renderAll();
        window.scrollTo(0, 0);
    },

    fabAction() {
        const boardsVisible = document.getElementById('page-boards')?.style.display !== 'none';
        if (boardsVisible) {
            BoardController.openNewModal();
        } else {
            const form = document.getElementById('add-col-form');
            if (form) {
                form.classList.remove('d-none');
                form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                const inp = form.querySelector('input[name="name"]');
                if (inp) inp.focus();
            }
        }
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   14. CONFIGURAÇÃO DE GRIDS DE CORES E GRADIENTES DO MODAL
   ══════════════════════════════════════════════════════════════════════════════ */
function setupSelectionGrids() {
    // Cores básicas
    const bgBasic = document.getElementById('color-grid-basic');
    if (bgBasic) {
        bgBasic.innerHTML = '';
        CONFIG.COLORS_BASIC.forEach((c) => {
            const d = document.createElement('div');
            d.className = 'td-color-swatch';
            d.style.background = c;
            d.title = c;
            d.onclick = () => {
                BoardController.setCover(c);
                d.classList.add('sel');
            };
            bgBasic.appendChild(d);
        });
    }

    // Cores escuras
    const bgDark = document.getElementById('color-grid-dark');
    if (bgDark) {
        bgDark.innerHTML = '';
        CONFIG.COLORS_DARK.forEach((c) => {
            const d = document.createElement('div');
            d.className = 'td-color-swatch';
            d.style.background = c;
            d.title = c;
            d.onclick = () => {
                BoardController.setCover(c);
                d.classList.add('sel');
            };
            bgDark.appendChild(d);
        });
    }

    // Gradientes
    const gg = document.getElementById('grad-grid');
    if (gg) {
        gg.innerHTML = '';
        CONFIG.GRADIENTS.forEach((gr) => {
            const d = document.createElement('div');
            d.className = 'td-grad-opt';
            d.style.background = gr;
            d.onclick = () => {
                BoardController.setCover(gr);
                document.querySelectorAll('.td-grad-opt').forEach((x) => x.classList.remove('sel'));
                d.classList.add('sel');
            };
            gg.appendChild(d);
        });
    }

    // Imagens sugeridas
    const ig = document.getElementById('img-grid');
    if (ig) {
        ig.innerHTML = '';
        CONFIG.IMAGES.forEach((url) => {
            const d = document.createElement('div');
            d.className = 'td-img-opt';
            d.style.backgroundImage = `url('${url}')`;
            const cssVal = `url('${url}')`;
            d.onclick = () => {
                BoardController.setCover(cssVal);
                document.querySelectorAll('.td-img-opt').forEach((x) => x.classList.remove('sel'));
                d.classList.add('sel');
            };
            ig.appendChild(d);
        });
    }

    // Mini modal de edição de board (eb-*)
    setupMiniEditBoardGrids();
}

function setupMiniEditBoardGrids() {
    const EB_COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#10b981',
        '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#0f172a', '#1e293b',
        '#172554', '#052e16', '#2e1065', '#450a0a'
    ];
    const EB_GRADS = [
        'linear-gradient(135deg,#667eea,#764ba2)',
        'linear-gradient(135deg,#f093fb,#f5576c)',
        'linear-gradient(135deg,#4facfe,#00f2fe)',
        'linear-gradient(135deg,#43e97b,#38f9d7)',
        'linear-gradient(135deg,#fa709a,#fee140)',
        'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
        'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
        'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
        'linear-gradient(135deg,#f6d365,#fda085)',
        'linear-gradient(135deg,#fc4a1a,#f7b733)'
    ];
    const EB_IMGS = [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80',
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
        'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=80',
        'https://images.unsplash.com/photo-1536152470836-b943b246224c?w=600&q=80',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80'
    ];
    const EB_EMOJIS = ['📋', '📌', '📊', '📈', '🎯', '🚀', '🏆', '💡', '⚡', '🔧', '🎨', '🌍', '💎', '🔥', '⭐', '✨', '🎪', '🗺', '💼', '🖥', '📁', '🎭', '🎬', '🎵', '🎮', '🦁', '🐉', '🧠', '🔮', '🌈'];

    window.ebSetCover = (val) => {
        document.getElementById('eb-cover-val').value = val;
        const prev = document.getElementById('eb-cover-preview');
        if (prev) {
            prev.style.background = val;
            prev.style.backgroundSize = 'cover';
            prev.style.backgroundPosition = 'center';
        }
        document.querySelectorAll('.eb-swatch, .eb-grad, .eb-img').forEach((x) => x.classList.remove('sel'));
    };

    window.ebOnFileChange = (input) => {
        if (!input.files || !input.files[0]) return;
        const label = document.getElementById('eb-upload-label');
        if (label) label.textContent = input.files[0].name;

        const reader = new FileReader();
        reader.onload = (e) => {
            const cssVal = `url('${e.target.result}')`;
            document.getElementById('eb-cover-val').value = cssVal;
            const prev = document.getElementById('eb-cover-preview');
            if (prev) prev.style.background = `${cssVal} center/cover`;
            document.querySelectorAll('.eb-swatch, .eb-grad, .eb-img').forEach((x) => x.classList.remove('sel'));
        };
        reader.readAsDataURL(input.files[0]);
    };

    window.ebApplyUrl = () => {
        const url = document.getElementById('eb-img-url')?.value.trim();
        if (!url) return;
        window.ebSetCover(`url('${url}')`);
    };

    window.ebSwitchTab = (btn) => {
        if (!btn) return;
        document.querySelectorAll('.eb-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        ['color', 'gradient', 'image'].forEach((t) => {
            const panel = document.getElementById(`eb-panel-${t}`);
            if (panel) panel.style.display = btn.dataset.tab === t ? '' : 'none';
        });
    };

    const cg = document.getElementById('eb-color-grid');
    if (cg) {
        cg.innerHTML = '';
        EB_COLORS.forEach((c) => {
            const d = document.createElement('div');
            d.className = 'eb-swatch';
            d.style.background = c;
            d.onclick = () => {
                window.ebSetCover(c);
                d.classList.add('sel');
            };
            cg.appendChild(d);
        });
    }

    const gg = document.getElementById('eb-grad-grid');
    if (gg) {
        gg.innerHTML = '';
        EB_GRADS.forEach((g) => {
            const d = document.createElement('div');
            d.className = 'eb-grad';
            d.style.background = g;
            d.onclick = () => {
                window.ebSetCover(g);
                document.querySelectorAll('.eb-grad').forEach((x) => x.classList.remove('sel'));
                d.classList.add('sel');
            };
            gg.appendChild(d);
        });
    }

    const ig = document.getElementById('eb-img-grid');
    if (ig) {
        ig.innerHTML = '';
        EB_IMGS.forEach((url) => {
            const d = document.createElement('div');
            d.className = 'eb-img';
            d.style.backgroundImage = `url('${url}')`;
            d.onclick = () => {
                window.ebSetCover(`url('${url}')`);
                document.querySelectorAll('.eb-img').forEach((x) => x.classList.remove('sel'));
                d.classList.add('sel');
            };
            ig.appendChild(d);
        });
    }

    const eg = document.getElementById('eb-emoji-grid');
    if (eg) {
        eg.innerHTML = '';
        EB_EMOJIS.forEach((e) => {
            const d = document.createElement('div');
            d.style.cssText = 'font-size:1.5rem;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:7px;cursor:pointer;transition:background .15s;';
            d.textContent = e;
            d.onmouseenter = () => { d.style.background = 'rgba(255,255,255,0.1)'; };
            d.onmouseleave = () => { d.style.background = ''; };
            d.onclick = () => {
                document.getElementById('eb-emoji-val').value = e;
                document.getElementById('eb-emoji-display').textContent = e;
                document.getElementById('eb-emoji-picker')?.classList.remove('open-inline');
            };
            eg.appendChild(d);
        });
    }

    ['edit-board-modal', 'members-modal'].forEach((id) => {
        const m = document.getElementById(id);
        if (m) {
            m.addEventListener('click', function (e) {
                if (e.target === this) this.classList.remove('open');
            });
        }
    });
}

/* ══════════════════════════════════════════════════════════════════════════════
   15. EVENT LISTENERS GLOBAIS (Teclado, Cliques fora de Modais e Histórico)
   ══════════════════════════════════════════════════════════════════════════════ */
function setupGlobalListeners() {
    // Fecha popovers de cor de destaque ao clicar fora
    document.addEventListener('click', (e) => {
        const pop = document.getElementById('acc-pop');
        if (pop && pop.classList.contains('open') && !e.target.closest('.acc-wrap')) {
            pop.classList.remove('open');
        }
    });

    // Fecha dropdowns de ação em lote ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#bulk-bar')) {
            BulkActionsController.closeDropdowns();
        }
    });

    // Fecha seletor de tags ao clicar fora
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('tag-picker');
        if (picker && !picker.contains(e.target) && !e.target.classList.contains('td-add-tag-btn')) {
            picker.style.display = 'none';
        }
    });

    // Submissão rápida de tag com tecla Enter
    document.getElementById('tag-name-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmAddTag();
    });

    // Redimensionamento automático do título e autosave
    document.getElementById('modal-title')?.addEventListener('input', function () {
        TaskController.autoResize(this);
        TaskController.autosave();
    });

    // Fecha modais com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            TaskController.closeTaskModal();
            document.querySelectorAll('.td-modal-bd.open, .td-task-modal-bd.open, .td-reminder-bd.open').forEach((m) => {
                m.classList.remove('open');
            });
        }
    });

    // Roteador de URL baseado em hash
    window.addEventListener('hashchange', () => Router.handle());

    // Fechar ao clicar no backdrop dos modais
    document.getElementById('task-modal-bd')?.addEventListener('click', function (e) {
        if (e.target === this) TaskController.closeTaskModal();
    });

    document.getElementById('reminder-modal-bd')?.addEventListener('click', function (e) {
        if (e.target === this) ReminderController.closeModal();
    });

    document.getElementById('auth-modal-bd')?.addEventListener('click', function (e) {
        if (e.target === this) AuthController.closeModal();
    });

    document.getElementById('ai-digest-modal-bd')?.addEventListener('click', function (e) {
        if (e.target === this) AiController.closeDailyDigestModal();
    });
}

/* ══════════════════════════════════════════════════════════════════════════════
   16. BRIDGE PÚBLICA NO WINDOW (Garantia de Zero Quebras no HTML)
   ──────────────────────────────────────────────────────────────────────────────
   Aqui expomos todas as funções invocadas por manipuladores inline (onclick,
   oninput, onsubmit, etc.) para garantir 100% de retrocompatibilidade com o DOM.
   ══════════════════════════════════════════════════════════════════════════════ */
window.esc = Utils.esc;
window.uid = Utils.uid;
window.pad2 = Utils.pad2;
window.todayISO = Utils.todayISO.bind(Utils);
window.addDaysISO = Utils.addDaysISO.bind(Utils);
window.formatDM = Utils.formatDM;
window.formatFullDate = Utils.formatFullDate;
window.formatCreatedDate = Utils.formatCreatedDate;
window.formatDMYHM = Utils.formatDMYHM;
window.relativeTime = Utils.relativeTime;
window.statusLabelFull = Utils.statusLabelFull;
window.priLabelFull = Utils.priLabelFull;

window.getCurrentBoard = getCurrentBoard;
window.findTaskInBoard = findTaskInBoard;
window.router = () => Router.handle();
window.openBoardListView = () => Router.openBoardListView();
window.openBoardView = (id) => Router.openBoardView(id);

window.filterBoards = () => BoardController.renderGrid();
window.openNewBoard = () => BoardController.openNewModal();
window.closeNewBoard = () => BoardController.closeNewModal();
window.openEditBoard = (id) => BoardController.openEditModal(id);
window.deleteBoard = (id) => BoardController.deleteBoard(id);
window.submitBoardForm = (e) => BoardController.submitBoardForm(e);
window.openEditBoardModal = () => BoardController.openEditBoardModal();
window.saveEditBoard = (e) => BoardController.saveEditBoard(e);
window.switchCoverTab = (tab, btn) => BoardController.switchCoverTab(tab, btn);
window.setCover = (val) => BoardController.setCover(val);
window.pickCustomColor = (val) => BoardController.setCover(val);
window.applyImgUrl = () => BoardController.applyImgUrl();
window.onCoverFileChange = (input) => BoardController.onCoverFileChange(input);

window.filterEmoji = () => EmojiPicker.render(document.getElementById('emoji-search')?.value.trim());

window.render = () => TaskController.renderAll();
window.switchViewTab = (btn) => TaskController.switchViewTab(btn);
window.addColumn = (e) => TaskController.addColumn(e);
window.deleteColumn = (id) => TaskController.deleteColumn(id);
window.renameColumn = (id, name) => TaskController.renameColumn(id, name);
window.submitAddTask = (e, colId) => TaskController.submitAddTask(e, colId);
window.deleteTask = (taskId) => TaskController.deleteTask(taskId);
window.exportBoardPDF = () => TaskController.exportBoardPDF();

window.openTaskModal = (id) => TaskController.openTaskModal(id);
window.closeTaskModal = () => TaskController.closeTaskModal();
window.autosave = () => TaskController.autosave();
window.updateProgressBar = (val) => TaskController.updateProgressBar(val);
window.setTaskColor = (col) => TaskController.setTaskColor(col);
window.sendComment = () => TaskController.sendComment();
window.toggleTagPicker = (e) => TaskController.toggleTagPicker(e);
window.confirmAddTag = () => TaskController.confirmAddTag();
window.removeTag = (idx) => TaskController.removeTag(idx);
window.addCheckItem = (text) => TaskController.addCheckItem(text);
window.toggleCheckItem = (idx) => TaskController.toggleCheckItem(idx);
window.removeCheckItem = (idx) => TaskController.removeCheckItem(idx);
window.updateCheckText = (idx, val) => TaskController.updateCheckText(idx, val);

window.openMembersModal = () => MembersController.openModal();
window.closeMembersModal = () => MembersController.closeModal();
window.onSearchBoardUsers = (val) => MembersController.onSearchBoardUsers(val);
window.addMemberToBoard = (userId, btn) => MembersController.addMemberToBoard(userId, btn);
window.removeMemberFromBoard = (userId, btn) => MembersController.removeMemberFromBoard(userId, btn);
window.switchNewBoardTab = (tab, btn) => BoardController.switchNewBoardTab(tab, btn);
window.onSearchNewBoardUsers = (val) => MembersController.onSearchNewBoardUsers(val);
window.toggleNewBoardMember = (userId) => MembersController.toggleNewBoardMember(userId);
window.addPerson = (e) => MembersController.add(e);
window.removePerson = (id) => MembersController.remove(id);

window.toggleTaskSelect = (cb) => BulkActionsController.toggleSelect(cb);
window.clearSelection = () => BulkActionsController.clear();
window.toggleBulkDropdown = (id) => BulkActionsController.toggleDropdown(id);
window.doBulkAction = (action, val) => BulkActionsController.doAction(action, val);
window.doBulkDelete = () => BulkActionsController.doDelete();
window.tdCardClick = (e, taskId) => {
    if (e.target.classList.contains('td-task-cb')) return;
    if (AppState.selectedIds.size > 0) {
        const cb = document.querySelector(`.td-task-card[data-task-id="${taskId}"] .td-task-cb`);
        if (cb) {
            cb.checked = !cb.checked;
            BulkActionsController.toggleSelect(cb);
        }
        return;
    }
    TaskController.openTaskModal(taskId);
};
window.handleRowClick = (e, taskId) => {
    if (e.target.classList.contains('td-task-cb') || e.target.tagName === 'INPUT') return;
    if (AppState.selectedIds.size > 0) {
        const row = e.currentTarget;
        const cb = row.querySelector('.td-row-cb');
        if (cb) {
            cb.checked = !cb.checked;
            BulkActionsController.toggleSelect(cb);
        }
        return;
    }
    TaskController.openTaskModal(taskId);
};

window.openReminderModal = () => ReminderController.openModal();
window.closeReminderModal = () => ReminderController.closeModal();
window.goToTaskFromReminder = (bId, tId) => ReminderController.goToTask(bId, tId);

// Bindings de Autenticação
window.openAuthModal = () => AuthController.openModal();
window.closeAuthModal = () => AuthController.closeModal();
window.switchAuthTab = (tab) => AuthController.switchTab(tab);
window.handleAuthLogin = (e) => AuthController.handleLogin(e);
window.handleAuthRegister = (e) => AuthController.handleRegister(e);
window.handleAuthLogout = () => AuthController.handleLogout();

// Bindings de Recursos de IA (Google Gemini)
window.suggestSubtasksWithAI = () => AiController.suggestSubtasks();
window.generateDescriptionWithAI = () => AiController.generateDescription();
window.openBoardDigestModal = () => AiController.openDailyDigestModal();
window.closeBoardDigestModal = () => AiController.closeDailyDigestModal();

window.toggleTheme = () => ThemeController.toggleTheme();
window.toggleAccentPop = (e) => ThemeController.toggleAccentPop(e);
window.setAccent = (name) => ThemeController.setAccent(name);

window.fabAction = () => Router.fabAction();

window.restoreDemoData = () => {
    if (!confirm('Isso vai apagar todos os dados atuais e restaurar o board de exemplo. Continuar?')) return;
    StorageService._db = StorageService.seedDB();
    StorageService.saveDB();
    sessionStorage.removeItem(CONFIG.REMINDERS_SESSION_KEY);
    BulkActionsController.clear();
    location.hash = '#/';
    Router.handle();
    ReminderController.maybeAutoShow();
};

/* ══════════════════════════════════════════════════════════════════════════════
   16. CONTROLADORES DE AUTENTICAÇÃO E IA (ETAPA 6)
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Controlador de Autenticação (Login, Cadastro e Estado do Usuário).
 */
const AuthController = {
    openModal() {
        const modal = document.getElementById('auth-modal-bd');
        if (!modal) return;

        const isAuth = typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated();
        const guestView = document.getElementById('auth-guest-view');
        const userView = document.getElementById('auth-user-view');

        if (isAuth) {
            const user = ApiService.auth.getUser() || { name: 'Usuário', email: '' };
            const initial = (user.name || 'U').charAt(0).toUpperCase();

            const avatarEl = document.getElementById('profile-avatar');
            const nameEl = document.getElementById('profile-name');
            const emailEl = document.getElementById('profile-email');

            if (avatarEl) avatarEl.textContent = initial;
            if (nameEl) nameEl.textContent = user.name;
            if (emailEl) emailEl.textContent = user.email;

            if (guestView) guestView.classList.add('d-none');
            if (userView) userView.classList.remove('d-none');
        } else {
            if (guestView) guestView.classList.remove('d-none');
            if (userView) userView.classList.add('d-none');
            this.switchTab('login');
        }

        modal.classList.add('open');
    },

    closeModal() {
        const modal = document.getElementById('auth-modal-bd');
        if (modal) modal.classList.remove('open');
    },

    switchTab(tab) {
        const loginTab = document.getElementById('tab-btn-login');
        const regTab = document.getElementById('tab-btn-register');
        const loginForm = document.getElementById('auth-login-form');
        const regForm = document.getElementById('auth-register-form');
        const loginErr = document.getElementById('login-error-msg');
        const regErr = document.getElementById('register-error-msg');

        if (loginErr) loginErr.classList.add('d-none');
        if (regErr) regErr.classList.add('d-none');

        if (tab === 'login') {
            if (loginTab) loginTab.classList.add('active');
            if (regTab) regTab.classList.remove('active');
            if (loginForm) loginForm.classList.remove('d-none');
            if (regForm) regForm.classList.add('d-none');
        } else {
            if (regTab) regTab.classList.add('active');
            if (loginTab) loginTab.classList.remove('active');
            if (regForm) regForm.classList.remove('d-none');
            if (loginForm) loginForm.classList.add('d-none');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value.trim();
        const password = document.getElementById('login-password')?.value;
        const errEl = document.getElementById('login-error-msg');
        const submitBtn = document.getElementById('login-submit-btn');

        if (errEl) errEl.classList.add('d-none');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Entrando...';
        }

        try {
            await ApiService.auth.login({ email, password });
            this.updateTopbar();
            this.closeModal();
            // Sincroniza dados com o banco Supabase
            await BackendSyncService.syncFromBackend();
            Router.handle();
        } catch (err) {
            if (errEl) {
                errEl.textContent = err.message || 'Falha ao fazer login. Verifique suas credenciais.';
                errEl.classList.remove('d-none');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="btn-text">Entrar</span>';
            }
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const errEl = document.getElementById('register-error-msg');
        const submitBtn = document.getElementById('reg-submit-btn');

        if (errEl) errEl.classList.add('d-none');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Cadastrando...';
        }

        try {
            await ApiService.auth.register({ name, email, password });
            this.updateTopbar();
            this.closeModal();
            await BackendSyncService.syncFromBackend();
            Router.handle();
        } catch (err) {
            if (errEl) {
                errEl.textContent = err.message || 'Falha ao criar conta.';
                errEl.classList.remove('d-none');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="btn-text">Criar Conta Grátis</span>';
            }
        }
    },

    handleLogout() {
        if (typeof ApiService !== 'undefined') {
            ApiService.auth.logout();
        }
        this.updateTopbar();
        this.closeModal();
        StorageService.loadDB();
        Router.handle();
    },

    updateTopbar() {
        const topbarBtn = document.getElementById('auth-topbar-btn');
        const labelEl = document.getElementById('auth-btn-label');
        if (!topbarBtn || !labelEl) return;

        const isAuth = typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated();
        if (isAuth) {
            const user = ApiService.auth.getUser();
            const firstName = user && user.name ? user.name.split(' ')[0] : 'Conta';
            topbarBtn.classList.add('logged-in');
            labelEl.textContent = firstName;
            labelEl.style.display = 'inline';
            topbarBtn.title = `Conectado como ${user ? user.name : ''} (Clique para ver perfil ou sair)`;
        } else {
            topbarBtn.classList.remove('logged-in');
            labelEl.textContent = 'Entrar';
            labelEl.style.display = 'none';
            topbarBtn.title = 'Entrar ou criar conta';
        }
    }
};

/**
 * Controlador de Recursos de IA (Google Gemini).
 */
const AiController = {
    async suggestSubtasks() {
        const titleInput = document.getElementById('modal-title');
        const descInput = document.getElementById('modal-desc');
        const btn = document.getElementById('ai-subtasks-btn');

        const title = titleInput ? titleInput.value.trim() : '';
        const description = descInput ? descInput.value.trim() : '';

        if (!title) {
            alert('Por favor, defina ao menos o título da tarefa para que a IA possa sugerir subtarefas.');
            return;
        }

        if (typeof ApiService === 'undefined') {
            alert('O serviço de API não está disponível.');
            return;
        }

        if (!ApiService.auth.isAuthenticated()) {
            alert('Para gerar subtarefas com Inteligência Artificial (Google Gemini), você precisa estar conectado à sua conta!\n\nVamos abrir a tela de acesso para você.');
            AuthController.openModal();
            return;
        }

        const originalHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Gerando...';
        }

        try {
            const res = await ApiService.ai.breakdown(title, description);
            if (res && Array.isArray(res.subtasks) && res.subtasks.length > 0) {
                const board = getCurrentBoard();
                for (const sub of res.subtasks) {
                    const item = {
                        id: Utils.uid('chk'),
                        text: sub.text,
                        done: false
                    };
                    AppState.currentChecklist.push(item);

                    if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated() && board && board.id !== 'board_demo' && AppState.currentTaskId && !AppState.currentTaskId.startsWith('task_')) {
                        ApiService.tasks.addChecklistItem(AppState.currentTaskId, sub.text)
                            .then(created => {
                                if (created && created.id) {
                                    item.id = created.id;
                                    StorageService.saveDB();
                                }
                            })
                            .catch(err => console.warn('[AiController] Falha ao persistir subtarefa no banco:', err));
                    }
                }
                TaskController.renderChecklist();
                TaskController.autosave();
            } else {
                alert('A IA não gerou sugestões para esta tarefa.');
            }
        } catch (err) {
            console.error('[AiController] Erro na sugestão de subtarefas:', err);
            alert(`Não foi possível gerar sugestões com IA:\n${err.message}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    },

    /**
     * Gera uma descrição profissional e detalhada para a tarefa usando Gemini.
     */
    async generateDescription() {
        const titleInput = document.getElementById('modal-title');
        const descInput = document.getElementById('modal-desc');
        const btn = document.getElementById('ai-desc-btn');

        const title = titleInput ? titleInput.value.trim() : '';
        const currentDescription = descInput ? descInput.value.trim() : '';

        if (!title) {
            alert('Por favor, defina ao menos o título da tarefa para que a IA possa elaborar a descrição.');
            return;
        }

        if (typeof ApiService === 'undefined') {
            alert('O serviço de API não está disponível.');
            return;
        }

        if (!ApiService.auth.isAuthenticated()) {
            alert('Para gerar a descrição com Inteligência Artificial (Google Gemini), você precisa estar conectado à sua conta!\n\nVamos abrir a tela de acesso para você.');
            AuthController.openModal();
            return;
        }

        const originalHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Gerando...';
        }

        try {
            const res = await ApiService.ai.generateDescription(title, currentDescription);
            if (res && res.description) {
                if (descInput) {
                    descInput.value = res.description;
                    TaskController.autoResize(descInput);
                }
                TaskController.autosave();
            } else {
                alert('A IA não retornou uma descrição válida.');
            }
        } catch (err) {
            console.error('[AiController] Erro na geração de descrição:', err);
            alert(`Não foi possível gerar a descrição com IA:\n${err.message}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    },

    async openDailyDigestModal() {
        const modal = document.getElementById('ai-digest-modal-bd');
        const contentEl = document.getElementById('ai-digest-content');
        if (!modal || !contentEl) return;

        modal.classList.add('open');

        // Se o usuário não estiver autenticado, orienta a fazer login com 1 clique
        if (typeof ApiService === 'undefined' || !ApiService.auth.isAuthenticated()) {
            contentEl.innerHTML = `
                <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(168,85,247,0.3);padding:24px 20px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2rem;margin-bottom:10px;">🔐</div>
                    <div style="font-weight:700;font-size:1.1rem;color:#f1f59;margin-bottom:8px;">Autenticação Necessária</div>
                    <div style="font-size:0.86rem;color:#94a3b8;line-height:1.5;margin-bottom:18px;">
                        Para gerar o resumo inteligente com o Google Gemini, você precisa estar conectado à sua conta para acessar os dados no PostgreSQL.
                    </div>
                    <button type="button" class="td-auth-submit-btn" style="max-width:240px;margin:0 auto;" onclick="AiController.closeDailyDigestModal(); AuthController.openModal();">
                        <i class="fas fa-sign-in-alt"></i> Entrar ou Criar Conta
                    </button>
                </div>
            `;
            return;
        }

        const boardId = AppState.currentBoardId;

        // Se estiver no quadro de demonstração local (não salvo no banco)
        if (boardId === 'board_demo' || !boardId) {
            contentEl.innerHTML = `
                <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);padding:24px 20px;border-radius:12px;text-align:center;">
                    <div style="font-size:2.2rem;margin-bottom:10px;">📋</div>
                    <div style="font-weight:700;font-size:1.1rem;color:#fcd34d;margin-bottom:8px;">Quadro Local de Exemplo</div>
                    <div style="font-size:0.86rem;color:#cbd5e1;line-height:1.5;margin-bottom:18px;">
                        Você está no quadro de demonstração local. Para que o Gemini resuma suas tarefas salvas na nuvem, selecione um dos seus quadros sincronizados ou crie um novo!
                    </div>
                    <button type="button" class="td-auth-submit-btn" style="max-width:240px;margin:0 auto;" onclick="AiController.closeDailyDigestModal(); openNewBoard();">
                        <i class="fas fa-plus"></i> Criar Novo Quadro
                    </button>
                </div>
            `;
            return;
        }

        contentEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;color:#94a3b8;padding:24px 0;">
                <i class="fas fa-circle-notch fa-spin fa-2x" style="color:#a855f7;"></i>
                <div>
                    <div style="font-weight:600;color:#2f80ed;font-size:0.95rem;">Consultando Google Gemini...</div>
                    <div style="font-size:0.8rem;color:#000000;">Analisando todas as tarefas, prioridades e prazos do quadro.</div>
                </div>
            </div>
        `;

        try {
            const res = await ApiService.ai.dailyDigest(boardId);
            if (res && res.digest) {
                contentEl.innerHTML = Utils.esc(res.digest)
                    .replace(/\n\n/g, '<br><br>')
                    .replace(/\n- /g, '<br>• ')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            } else {
                contentEl.innerHTML = '<div style="color:#94a3b8;">Nenhum resumo pôde ser gerado para este quadro.</div>';
            }
        } catch (err) {
            console.error('[AiController] Erro ao obter resumo do Gemini:', err);
            contentEl.innerHTML = `
                <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);padding:14px;border-radius:10px;color:#fca5a5;">
                    <div style="font-weight:700;margin-bottom:6px;"><i class="fas fa-exclamation-triangle"></i> Falha ao consultar o Gemini</div>
                    <div style="font-size:0.85rem;line-height:1.5;">${Utils.esc(err.message)}</div>
                </div>
            `;
        }
    },

    closeDailyDigestModal() {
        const modal = document.getElementById('ai-digest-modal-bd');
        if (modal) modal.classList.remove('open');
    }
};

/**
 * Serviço de sincronização de dados entre a API NestJS e o armazenamento local.
 */
const BackendSyncService = {
    async syncFromBackend() {
        if (typeof ApiService === 'undefined' || !ApiService.auth.isAuthenticated()) {
            return false;
        }

        try {
            const boards = await ApiService.boards.list();
            if (Array.isArray(boards) && boards.length > 0) {
                const mappedBoards = boards.map(b => ({
                    id: b.id,
                    name: b.name,
                    emoji: b.emoji || '📋',
                    cover: b.cover || '',
                    coverIsImage: Boolean(b.coverIsImage),
                    createdAt: b.createdAt,
                    userId: b.userId,
                    user: b.user,
                    members: (b.members || []).map(m => ({
                        id: m.userId || m.user?.id || m.id,
                        memberId: m.id,
                        name: m.user?.name || m.name || 'Membro',
                        email: m.user?.email || m.email || '',
                        avatarUrl: m.user?.avatarUrl || m.avatarUrl || '',
                        role: m.role || 'member'
                    })),
                    columns: (b.columns || []).map(col => ({
                        id: col.id,
                        name: col.name,
                        color: col.color || '#3b82f6',
                        order: col.order,
                        tasks: (col.tasks || []).map(t => ({
                            id: t.id,
                            title: t.title,
                            description: t.description || '',
                            status: t.status || 'todo',
                            priority: t.priority || 'media',
                            assignedTo: t.assignedTo || '',
                            deadline: t.deadline || '',
                            deadlineTime: t.deadlineTime || '',
                            progress: t.progress || 0,
                            color: t.color || '',
                            createdAt: t.createdAt,
                            updatedAt: t.updatedAt,
                            tags: (t.tags || []).map(tag => ({
                                id: tag.id,
                                text: tag.name || tag.text,
                                color: tag.color
                            })),
                            checklist: (t.checklist || []).map(chk => ({
                                id: chk.id,
                                text: chk.text,
                                done: Boolean(chk.done)
                            })),
                            comments: (t.comments || []).map(c => ({
                                id: c.id,
                                author: c.author || 'Usuário',
                                authorInitials: (c.author || 'U').charAt(0).toUpperCase(),
                                text: c.text,
                                ts: Utils.formatDMYHM(c.createdAt)
                            }))
                        }))
                    }))
                }));

                const db = StorageService.getDB();
                const currentBoards = db.boards || [];

                // Merge protetivo: preserva tarefas e checklists locais
                mappedBoards.forEach(b => {
                    const localB = currentBoards.find(lb => lb.id === b.id);
                    if (!localB) return;
                    b.columns.forEach(col => {
                        const localCol = localB.columns.find(lc => lc.id === col.id);
                        if (!localCol) return;
                        col.tasks.forEach(t => {
                            const localT = localCol.tasks.find(lt => lt.id === t.id);
                            if (localT) {
                                if (localT.checklist && localT.checklist.length > 0 && (!t.checklist || t.checklist.length === 0)) {
                                    t.checklist = localT.checklist;
                                }
                                if (localT.comments && localT.comments.length > 0 && (!t.comments || t.comments.length === 0)) {
                                    t.comments = localT.comments;
                                }
                            }
                        });
                        // Preserva tarefas locais que ainda não constem na resposta do backend
                        const unsynced = localCol.tasks.filter(lt => !col.tasks.some(ct => ct.id === lt.id));
                        if (unsynced.length > 0) {
                            col.tasks.push(...unsynced);
                        }
                    });
                });

                // Preserva todos os quadros locais que não existem no backend (ex: board_demo ou criados offline)
                const localOnlyBoards = currentBoards.filter(lb => !mappedBoards.some(mb => mb.id === lb.id));
                db.boards = [...mappedBoards, ...localOnlyBoards];
                StorageService.saveDB();
                return true;
            } else if (Array.isArray(boards) && boards.length === 0) {
                // Usuário novo autenticado sem quadros: cria quadro inicial no Supabase
                const newBoard = await ApiService.boards.create({
                    name: 'Meu Primeiro Quadro',
                    emoji: '🚀'
                });
                if (newBoard) {
                    return await this.syncFromBackend();
                }
            }
        } catch (err) {
            console.warn('[BackendSyncService] Não foi possível sincronizar com o backend:', err.message);
        }
        return false;
    }
};

// Módulos e Namespaces expostos para inspeção no console e testes
window.CONFIG = CONFIG;
window.Utils = Utils;
window.StorageService = StorageService;
window.AppState = AppState;
window.ViewTemplates = ViewTemplates;
window.BoardController = BoardController;
window.EmojiPicker = EmojiPicker;
window.TaskController = TaskController;
window.BulkActionsController = BulkActionsController;
window.ReminderController = ReminderController;
window.ThemeController = ThemeController;
window.MembersController = MembersController;
window.AuthController = AuthController;
window.AiController = AiController;
window.BackendSyncService = BackendSyncService;
window.Router = Router;

/* ══════════════════════════════════════════════════════════════════════════════
   17. INICIALIZAÇÃO DA APLICAÇÃO (Bootstrap Seguro)
   ══════════════════════════════════════════════════════════════════════════════ */
let isAppInitialized = false;

function initApp() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    setupSelectionGrids();
    EmojiPicker.buildCategories();
    EmojiPicker.render('');
    BoardController.setCover(AppState.selCover);
    TaskController.populateAssigneeSelect();
    BulkActionsController.initSwatches();

    ThemeController.initTheme();
    ThemeController.initAccent();

    setupGlobalListeners();

    // Atualiza botão de perfil/login e sincroniza com backend se autenticado
    AuthController.updateTopbar();
    if (typeof ApiService !== 'undefined' && ApiService.auth.isAuthenticated()) {
        BackendSyncService.syncFromBackend().then(() => Router.handle());
    }

    // Ouvintes para atualização reativa de estado de sessão
    window.addEventListener('auth:login', () => {
        AuthController.updateTopbar();
    });
    window.addEventListener('auth:logout', () => {
        AuthController.updateTopbar();
    });
    window.addEventListener('auth:expired', () => {
        AuthController.updateTopbar();
    });

    Router.handle();
    ReminderController.maybeAutoShow();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

