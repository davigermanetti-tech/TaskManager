/**
 * ══════════════════════════════════════════════════════════════════════════════
 * TASKMANAGER — CLIENTE HTTP DA API (FRONTEND)
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Este arquivo centraliza todas as comunicações HTTP entre o navegador e o
 * servidor backend NestJS rodando na porta 3000.
 * 
 * Padrões arquiteturais aplicados:
 * 1. Singleton / Namespace: Centraliza métodos sob o objeto global `ApiService`.
 * 2. Injeção Automática de JWT: O método `request()` anexa automaticamente o
 *    cabeçalho `Authorization: Bearer <token>` em todas as requisições autenticadas.
 * 3. Interceptor de Erros: Trata respostas com status 400, 401 (expirado), 403, 500
 *    e formata mensagens amigáveis em português.
 * 4. Suporte a IA: Comunica-se com os endpoints do Google Gemini para
 *    decomposição de subtarefas, processamento em linguagem natural e resumos.
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use strict';

const ApiService = (function () {
    // Configurações do serviço de API
    const CONFIG = Object.freeze({
        BASE_URL: (function () {
            if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
                return window.__API_BASE_URL__;
            }
            if (typeof localStorage !== 'undefined') {
                const customUrl = localStorage.getItem('taskmanager_api_base_url');
                if (customUrl) return customUrl;
            }
            // Em desenvolvimento local (Live Server ou localhost)
            if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                return 'http://localhost:3000';
            }
            // Em produção (Render / Vercel)
            return typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';
        })(),
        TOKEN_STORAGE_KEY: 'taskmanager_jwt_token',
        USER_STORAGE_KEY: 'taskmanager_user_profile',
    });

    /**
     * Métodos auxiliares para gerenciar a sessão do usuário no localStorage.
     */
    const Session = {
        /**
         * Recupera o token JWT gravado localmente.
         * @returns {string|null}
         */
        getToken() {
            try {
                return localStorage.getItem(CONFIG.TOKEN_STORAGE_KEY);
            } catch (e) {
                console.error('[ApiService] Falha ao ler token do localStorage:', e);
                return null;
            }
        },

        /**
         * Recupera os dados do usuário autenticado gravados localmente.
         * @returns {object|null}
         */
        getUser() {
            try {
                const raw = localStorage.getItem(CONFIG.USER_STORAGE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                console.error('[ApiService] Falha ao ler dados do usuário:', e);
                return null;
            }
        },

        /**
         * Salva o token JWT e o objeto do usuário após login ou cadastro.
         * @param {string} token 
         * @param {object} user 
         */
        setSession(token, user) {
            try {
                if (token) localStorage.setItem(CONFIG.TOKEN_STORAGE_KEY, token);
                if (user) localStorage.setItem(CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
            } catch (e) {
                console.error('[ApiService] Falha ao salvar sessão:', e);
            }
        },

        /**
         * Limpa a sessão (Logout).
         */
        clear() {
            try {
                localStorage.removeItem(CONFIG.TOKEN_STORAGE_KEY);
                localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
            } catch (e) {
                console.error('[ApiService] Falha ao limpar sessão:', e);
            }
        },

        /**
         * Retorna se o usuário está atualmente autenticado.
         * @returns {boolean}
         */
        isAuthenticated() {
            return Boolean(this.getToken());
        }
    };

    /**
     * Wrapper genérico de requisição HTTP usando a API nativa `fetch`.
     * Injeta automaticamente headers de JSON e token Bearer.
     * 
     * @param {string} endpoint - Ex: '/auth/login', '/boards'
     * @param {RequestInit} [options={}] - Objeto de opções do fetch (method, body, etc.)
     * @returns {Promise<any>}
     */
    async function request(endpoint, options = {}) {
        const url = `${CONFIG.BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        // Se houver um token JWT ativo, injeta o cabeçalho Authorization
        const token = Session.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Se o token estiver expirado ou inválido (HTTP 401), desloga suavemente
            if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
                console.warn('[ApiService] Sessão expirada ou não autorizada. Limpando credenciais...');
                Session.clear();
                window.dispatchEvent(new CustomEvent('auth:expired'));
                throw new Error('Sua sessão expirou. Por favor, faça login novamente.');
            }

            // Tratamento de respostas vazias (ex: 204 No Content para DELETE)
            if (response.status === 204) {
                return null;
            }

            // Tenta decodificar o corpo da resposta como JSON
            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            // Se o status HTTP indicar erro (>= 400), lança uma exceção com a mensagem do backend
            if (!response.ok) {
                let errorMsg = 'Ocorreu um erro na requisição.';
                if (data && typeof data === 'object') {
                    if (Array.isArray(data.message)) {
                        // Validações do class-validator retornam um array de mensagens
                        errorMsg = data.message.join(' | ');
                    } else if (data.message) {
                        errorMsg = data.message;
                    }
                } else if (typeof data === 'string' && data.length > 0) {
                    errorMsg = data;
                }
                throw new Error(errorMsg);
            }

            return data;
        } catch (error) {
            // Se for erro de rede (backend offline ou erro de conexão)
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Não foi possível conectar ao servidor backend (porta 3000). Verifique se o servidor está ativo.');
            }
            throw error;
        }
    }

    /* ══════════════════════════════════════════════════════════════════════════
       MÓDULO DE AUTENTICAÇÃO (Auth)
       ══════════════════════════════════════════════════════════════════════════ */
    const auth = {
        /**
         * Registra um novo usuário no sistema.
         * @param {{ name: string, email: string, password: string }} data
         * @returns {Promise<{ user: object, accessToken: string }>}
         */
        async register({ name, email, password }) {
            const result = await request('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });
            Session.setSession(result.accessToken, result.user);
            window.dispatchEvent(new CustomEvent('auth:login', { detail: result.user }));
            return result;
        },

        /**
         * Autentica um usuário existente com e-mail e senha.
         * @param {{ email: string, password: string }} data
         * @returns {Promise<{ user: object, accessToken: string }>}
         */
        async login({ email, password }) {
            const result = await request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            Session.setSession(result.accessToken, result.user);
            window.dispatchEvent(new CustomEvent('auth:login', { detail: result.user }));
            return result;
        },

        /**
         * Busca o perfil do usuário logado diretamente da rota protegida.
         * @returns {Promise<object>}
         */
        async getProfile() {
            return await request('/auth/me', { method: 'GET' });
        },

        /**
         * Encerra a sessão ativa do usuário.
         */
        logout() {
            Session.clear();
            window.dispatchEvent(new CustomEvent('auth:logout'));
        },

        /**
         * Retorna o usuário gravado na sessão local.
         */
        getUser: () => Session.getUser(),

        /**
         * Verifica se há um token JWT válido gravado.
         */
        isAuthenticated: () => Session.isAuthenticated(),

        /**
         * Retorna o token atual.
         */
        getToken: () => Session.getToken()
    };

    /* ══════════════════════════════════════════════════════════════════════════
       MÓDULO DE BOARDS / QUADROS
       ══════════════════════════════════════════════════════════════════════════ */
    const boards = {
        /**
         * Lista todos os quadros do usuário autenticado.
         * @returns {Promise<Array>}
         */
        async list() {
            return await request('/boards', { method: 'GET' });
        },

        /**
         * Busca um quadro específico com todas as suas colunas e tarefas.
         * @param {string} id 
         * @returns {Promise<object>}
         */
        async get(id) {
            return await request(`/boards/${encodeURIComponent(id)}`, { method: 'GET' });
        },

        /**
         * Cria um novo quadro.
         * @param {{ name: string, emoji?: string, cover?: string, coverIsImage?: boolean }} data
         * @returns {Promise<object>}
         */
        async create(data) {
            return await request('/boards', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * Atualiza os dados de um quadro (nome, emoji, capa).
         * @param {string} id 
         * @param {object} data 
         * @returns {Promise<object>}
         */
        async update(id, data) {
            return await request(`/boards/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },

        /**
         * Exclui um quadro e seus dados associados.
         * @param {string} id 
         * @returns {Promise<void>}
         */
        async delete(id) {
            return await request(`/boards/${encodeURIComponent(id)}`, { method: 'DELETE' });
        },

        /**
         * Busca os membros de um quadro.
         * @param {string} id
         * @returns {Promise<Array>}
         */
        async getMembers(id) {
            return await request(`/boards/${encodeURIComponent(id)}/members`, { method: 'GET' });
        },

        /**
         * Adiciona um usuário cadastrado como membro do quadro.
         * @param {string} boardId
         * @param {string} userId
         * @param {string} [role='member']
         * @returns {Promise<object>}
         */
        async addMember(boardId, userId, role = 'member') {
            return await request(`/boards/${encodeURIComponent(boardId)}/members`, {
                method: 'POST',
                body: JSON.stringify({ userId, role })
            });
        },

        /**
         * Remove um participante do quadro.
         * @param {string} boardId
         * @param {string} userId
         * @returns {Promise<void>}
         */
        async removeMember(boardId, userId) {
            return await request(`/boards/${encodeURIComponent(boardId)}/members/${encodeURIComponent(userId)}`, {
                method: 'DELETE'
            });
        }
    };

    /* ══════════════════════════════════════════════════════════════════════════
       MÓDULO DE USUÁRIOS (Users)
       ══════════════════════════════════════════════════════════════════════════ */
    const users = {
        /**
         * Lista usuários cadastrados no banco com busca opcional.
         * @param {string} [search='']
         * @returns {Promise<Array>}
         */
        async list(search = '') {
            const query = search ? `?search=${encodeURIComponent(search)}` : '';
            return await request(`/users${query}`, { method: 'GET' });
        }
    };

    /* ══════════════════════════════════════════════════════════════════════════
       MÓDULO DE COLUNAS
       ══════════════════════════════════════════════════════════════════════════ */
    const columns = {
        /**
         * Cria uma nova coluna no quadro.
         * @param {{ name: string, color?: string, boardId: string, order?: number }} data 
         */
        async create(data) {
            return await request('/columns', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        /**
         * Atualiza o nome, cor ou ordem da coluna.
         * @param {string} id 
         * @param {object} data 
         */
        async update(id, data) {
            return await request(`/columns/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },

        /**
         * Remove uma coluna do quadro.
         * @param {string} id 
         */
        async delete(id) {
            return await request(`/columns/${encodeURIComponent(id)}`, { method: 'DELETE' });
        }
    };

    /* ══════════════════════════════════════════════════════════════════════════
       MÓDULO DE TAREFAS (Tasks & Sub-recursos)
       ══════════════════════════════════════════════════════════════════════════ */
    const tasks = {
        /**
         * Cria uma nova tarefa em uma coluna.
         * @param {object} taskData
         */
        async create(taskData) {
            return await request('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });
        },

        /**
         * Busca uma tarefa por ID com seus detalhes, checklist, tags e comentários.
         * @param {string} id 
         */
        async get(id) {
            return await request(`/tasks/${encodeURIComponent(id)}`, { method: 'GET' });
        },

        /**
         * Atualiza as propriedades de uma tarefa.
         * @param {string} id 
         * @param {object} taskData 
         */
        async update(id, taskData) {
            return await request(`/tasks/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: JSON.stringify(taskData)
            });
        },

        /**
         * Exclui uma tarefa.
         * @param {string} id 
         */
        async delete(id) {
            return await request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
        },

        /**
         * Move uma tarefa entre colunas e/ou reordena (Drag and Drop).
         * @param {string} id 
         * @param {string} targetColumnId 
         * @param {number} newOrder 
         */
        async move(id, targetColumnId, newOrder) {
            return await request(`/tasks/${encodeURIComponent(id)}/move`, {
                method: 'PATCH',
                body: JSON.stringify({ targetColumnId, newOrder })
            });
        },

        /**
         * Adiciona um item ao checklist da tarefa.
         * @param {string} taskId 
         * @param {string} text 
         */
        async addChecklistItem(taskId, text) {
            return await request(`/tasks/${encodeURIComponent(taskId)}/checklist`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        },

        /**
         * Atualiza o estado (marcado/desmarcado) ou texto de um item do checklist.
         * @param {string} itemId 
         * @param {{ done?: boolean, text?: string }} data 
         */
        async updateChecklistItem(itemId, data) {
            return await request(`/tasks/checklist/${encodeURIComponent(itemId)}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },

        /**
         * Remove um item do checklist.
         * @param {string} itemId 
         */
        async deleteChecklistItem(itemId) {
            return await request(`/tasks/checklist/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
        },

        /**
         * Adiciona uma tag à tarefa.
         * @param {string} taskId 
         * @param {string} name 
         * @param {string} color 
         */
        async addTag(taskId, name, color) {
            return await request(`/tasks/${encodeURIComponent(taskId)}/tags`, {
                method: 'POST',
                body: JSON.stringify({ name, color })
            });
        },

        /**
         * Remove uma tag de uma tarefa.
         * @param {string} tagId 
         */
        async deleteTag(tagId) {
            return await request(`/tasks/tags/${encodeURIComponent(tagId)}`, { method: 'DELETE' });
        },

        /**
         * Adiciona um comentário à tarefa.
         * @param {string} taskId 
         * @param {string} text 
         */
        async addComment(taskId, text) {
            return await request(`/tasks/${encodeURIComponent(taskId)}/comments`, {
                method: 'POST',
                body: JSON.stringify({ text })
            });
        }
    };

    /* ══════════════════════════════════════════════════════════════════════════
       MÓDULO DE INTELIGÊNCIA ARTIFICIAL (Google Gemini)
       ══════════════════════════════════════════════════════════════════════════ */
    const ai = {
        /**
         * Gera automaticamente uma lista de subtarefas / passos práticos
         * com base no título e descrição da tarefa.
         * @param {string} title 
         * @param {string} [description=''] 
         * @returns {Promise<{ subtasks: Array<{ text: string }> }>}
         */
        async breakdown(title, description = '') {
            return await request('/ai/breakdown', {
                method: 'POST',
                body: JSON.stringify({ title, description })
            });
        },

        /**
         * Gera uma descrição profissional, clara e estruturada para uma tarefa com base no título.
         * @param {string} title 
         * @param {string} [currentDescription=''] 
         * @returns {Promise<{ title: string, description: string }>}
         */
        async generateDescription(title, currentDescription = '') {
            return await request('/ai/description', {
                method: 'POST',
                body: JSON.stringify({ title, currentDescription })
            });
        },

        /**
         * Analisa um comando em linguagem natural do usuário e extrai título,
         * prioridade, data de entrega sugerida e tags.
         * @param {string} prompt 
         * @returns {Promise<object>}
         */
        async parseTask(prompt) {
            return await request('/ai/parse-task', {
                method: 'POST',
                body: JSON.stringify({ prompt })
            });
        },

        /**
         * Gera um resumo executivo inteligente e motivador sobre o status atual do quadro.
         * @param {string} boardId 
         * @returns {Promise<{ digest: string }>}
         */
        async dailyDigest(boardId) {
            return await request('/ai/daily-digest', {
                method: 'POST',
                body: JSON.stringify({ boardId })
            });
        }
    };

    // Interface pública do serviço
    return {
        CONFIG,
        auth,
        users,
        boards,
        columns,
        tasks,
        ai,
        request
    };
})();

// Exporta globalmente para o navegador (window.ApiService)
if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
}

