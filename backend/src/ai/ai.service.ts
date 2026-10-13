import {
  Injectable,
  ServiceUnavailableException,
  NotFoundException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SubtaskBreakdownDto,
  ParseTaskPromptDto,
  DailyDigestDto,
  GenerateDescriptionDto,
} from './dto/ai.dto.js';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * AI SERVICE — INTEGRAÇÃO COM GOOGLE GEMINI
 * ══════════════════════════════════════════════════════════════════════════════
 * Fornece recursos de Inteligência Artificial Generativa para o TaskManager:
 * 1. Quebra de tarefas amplas em subtarefas (Checklist).
 * 2. Criação inteligente de tarefas por Linguagem Natural (NLP).
 * 3. Resumo Executivo Diário (Daily Standup Digest).
 */
@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Helper que valida se a chave da API está configurada.
   */
  private getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new ServiceUnavailableException(
        'A chave GEMINI_API_KEY não está configurada no arquivo .env do backend.',
      );
    }

    if (!this.genAI) {
      this.genAI = new GoogleGenerativeAI(apiKey.trim());
    }

    // Modelo estável, ultra veloz (< 1s) e de baixo custo do Google Gemini
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    return this.genAI!.getGenerativeModel({ model: modelName });
  }

  /**
   * Remove marcadores de código markdown caso a IA retorne ```json ... ```
   */
  private cleanJsonResponse(raw: string): string {
    return raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  /**
   * 1. QUEBRA AUTOMÁTICA DE TAREFAS EM SUBTAREFAS
   * ──────────────────────────────────────────────────────────────────────────
   * Analisa o título/descrição e gera uma lista de 3 a 6 passos para checklist.
   */
  async generateSubtasks(dto: SubtaskBreakdownDto) {
    const model = this.getModel();

    const prompt = `
Você é um especialista em gestão de projetos e produtividade ágil.
Analise a tarefa abaixo e crie entre 3 a 6 passos objetivos, acionáveis e diretos para compor uma checklist.

Tarefa: "${dto.title}"
Descrição adicional: "${dto.description || 'Nenhuma'}"

Retorne ESTRITAMENTE um objeto JSON no formato abaixo, sem markdown:
{
  "subtasks": [
    "Primeiro passo prático",
    "Segundo passo prático"
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const parsed = JSON.parse(this.cleanJsonResponse(text));
      const rawList = parsed.subtasks || parsed.subtarefas || [];
      const subtasks = rawList.map((item: any) => {
        if (typeof item === 'string') return { text: item };
        return { text: item.text || item.descricao || item.title || String(item) };
      });

      return {
        taskTitle: dto.title,
        subtasks: subtasks.length > 0 ? subtasks : [{ text: 'Iniciar execução' }],
      };
    } catch (err) {
      // Fallback de segurança se o modelo devolver texto puro com marcadores
      const lines = text
        .split('\n')
        .map((l) => l.replace(/^[-*•0-9.]+\s*/, '').trim())
        .filter((l) => l.length > 2 && !l.startsWith('{') && !l.startsWith('}'));

      return {
        taskTitle: dto.title,
        subtasks: lines.slice(0, 5).map((l) => ({ text: l })),
      };
    }
  }

  /**
   * 2. CRIAÇÃO DE TAREFAS POR LINGUAGEM NATURAL (NLP Task Parser)
   * ──────────────────────────────────────────────────────────────────────────
   * Extrai título limpo, data de prazo (YYYY-MM-DD), horário (HH:mm) e prioridade
   * a partir de frases como: "Reunião de alinhamento amanhã às 15h prioridade alta".
   */
  async parseTaskFromPrompt(dto: ParseTaskPromptDto) {
    const model = this.getModel();
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
Você é um interpretador semântico de tarefas para um TaskManager.
Data de referência atual (HOJE): ${today}.

Analise a seguinte frase digitada pelo usuário e extraia os atributos estruturados:
"${dto.prompt}"

Regras:
- "title": O título claro da tarefa, sem os termos de prazo ou prioridade.
- "deadline": A data calculada no formato ISO "YYYY-MM-DD" (calcule corretamente termos como "hoje", "amanhã", dias da semana). Se não mencionado, retorne null.
- "deadlineTime": O horário no formato "HH:mm" (ex: "15:00"). Se não mencionado, retorne null.
- "priority": "baixa", "media" ou "alta" (se inferido ou mencionado; padrão "media").
- "suggestedStatus": "todo".

Retorne ESTRITAMENTE um JSON válido no formato abaixo, sem markdown:
{
  "title": "...",
  "deadline": "YYYY-MM-DD" ou null,
  "deadlineTime": "HH:mm" ou null,
  "priority": "baixa" | "media" | "alta",
  "suggestedStatus": "todo"
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const parsed = JSON.parse(this.cleanJsonResponse(text));
      return {
        originalPrompt: dto.prompt,
        ...parsed,
      };
    } catch (err) {
      return {
        originalPrompt: dto.prompt,
        title: dto.prompt,
        deadline: null,
        deadlineTime: null,
        priority: 'media',
        suggestedStatus: 'todo',
      };
    }
  }

  /**
   * 3. RESUMO EXECUTIVO DIÁRIO DO QUADRO (Daily Standup Digest)
   * ──────────────────────────────────────────────────────────────────────────
   * Lê as tarefas reais do banco via Prisma e gera um resumo analítico para o usuário.
   */
  async generateDailyDigest(dto: DailyDigestDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: dto.boardId },
      include: {
        columns: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board "${dto.boardId}" não encontrado.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const allTasks = board.columns.flatMap((c) => c.tasks);

    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter((t) => t.status === 'done').length;
    const doingTasks = allTasks.filter((t) => t.status === 'doing').length;
    const overdueTasks = allTasks.filter(
      (t) => t.deadline && t.deadline < todayStr && t.status !== 'done',
    ).length;
    const todayTasks = allTasks.filter(
      (t) => t.deadline === todayStr && t.status !== 'done',
    ).length;

    const model = this.getModel();

    const prompt = `
Você é um assistente de produtividade executiva.
Com base nas seguintes estatísticas reais do quadro "${board.name}":
- Total de tarefas: ${totalTasks}
- Concluídas: ${doneTasks}
- Em andamento: ${doingTasks}
- Atrasadas com urgência: ${overdueTasks}
- Com prazo para HOJE: ${todayTasks}

Gere um resumo executivo em português do Brasil (2 parágrafos curtos), motivador, claro e com foco nas prioridades imediatas.
Use formatação elegante em texto corrido (pode usar emojis discretos).
`;

    const result = await model.generateContent(prompt);
    const digestText = result.response.text();

    return {
      boardName: board.name,
      metrics: {
        total: totalTasks,
        done: doneTasks,
        doing: doingTasks,
        overdue: overdueTasks,
        today: todayTasks,
      },
      digest: digestText.trim(),
    };
  }

  /**
   * 4. GERAÇÃO DE DESCRIÇÃO DA TAREFA COM IA (Task Description Generator)
   * ──────────────────────────────────────────────────────────────────────────
   * Gera uma descrição completa, profissional e estruturada para a tarefa.
   */
  async generateDescription(dto: GenerateDescriptionDto) {
    const model = this.getModel();

    const prompt = `
Você é um especialista em gerenciamento de projetos e especificação de tarefas ágeis.
Com base no título da tarefa abaixo e no contexto existente (se houver), elabore uma descrição profissional, clara e concisa.

Título da Tarefa: "${dto.title}"
Contexto atual: "${dto.currentDescription || 'Nenhum'}"

Estrutura recomendada:
- **Objetivo**: O que precisa ser feito e por quê.
- **Escopo**: Principais pontos de atenção e entregáveis.
- **Critérios de Conclusão**: O que define que a tarefa está pronta.

Retorne em texto bem formatado em português do Brasil. Seja direto, prático e sem introduções ou despedidas desnecessárias.
`;

    const result = await model.generateContent(prompt);
    const description = result.response.text();

    return {
      title: dto.title,
      description: description.trim(),
    };
  }
}

