// ===================================================
// LIFE LEVEL — Mission Templates (procedural pool)
// ===================================================

export interface MissionTemplate {
  id: string
  title: string
  description: string
  category: string        // attribute key it primarily belongs to
  focus: string
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  xp: number
  coins: number
  attribute_gains: Record<string, number>
  skill_category?: string
  api?: string | null
  weatherNeeded?: boolean
  weekendOnly?: boolean
  nightOnly?: boolean
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  // ---------- CORPO ----------
  { id: 'corpo_treino_001', title: 'Protocolo de Ativação Física', description: 'Execute uma sessão de 30 minutos com {exercise_1}, {exercise_2} e {exercise_3}. Registre ao completar.', category: 'corpo', focus: 'treino', difficulty: 'medium', xp: 30, coins: 5, attribute_gains: { corpo: 8, disciplina: 4, energia: 3 }, skill_category: 'treino_fisico', api: 'wger' },
  { id: 'corpo_treino_002', title: 'Resistência de Aço', description: 'Faça 3 séries de flexões até a falha + 3 séries de prancha de 45s. Sem desculpas, {nick}.', category: 'corpo', focus: 'treino', difficulty: 'medium', xp: 28, coins: 5, attribute_gains: { corpo: 7, disciplina: 5 } },
  { id: 'corpo_outdoor_001', title: 'Missão Ar Livre', description: 'O clima hoje está {weather_desc} ({temp}°C). Condição ideal: faça 30 minutos de caminhada ou corrida ao ar livre.', category: 'corpo', focus: 'treino', difficulty: 'easy', xp: 22, coins: 3, attribute_gains: { corpo: 6, energia: 5 }, api: 'open_meteo', weatherNeeded: true },
  { id: 'corpo_hidratacao_001', title: 'Protocolo de Hidratação', description: 'Beba no mínimo 2 litros de água ao longo do dia. Mantenha uma garrafa por perto e registre.', category: 'corpo', focus: 'hidratacao', difficulty: 'easy', xp: 15, coins: 2, attribute_gains: { corpo: 4, energia: 3 } },
  { id: 'corpo_mobilidade_001', title: 'Desbloqueio Articular', description: 'Faça 10 minutos de alongamento e mobilidade. Foque em quadris, ombros e coluna.', category: 'corpo', focus: 'mobilidade', difficulty: 'easy', xp: 15, coins: 2, attribute_gains: { corpo: 5 } },
  { id: 'corpo_nutricao_001', title: 'Protocolo Nutricional', description: 'Hoje: café equilibrado, almoço com proteína + vegetais, jantar leve antes das 20h. Evite ultraprocessados.', category: 'corpo', focus: 'nutricao', difficulty: 'easy', xp: 20, coins: 3, attribute_gains: { corpo: 5, energia: 5, disciplina: 2 } },
  { id: 'corpo_culinaria_001', title: 'Operação Cozinha', description: 'Prepare do zero este prato: {meal_name} ({meal_area}). Cozinhar é autocuidado.', category: 'corpo', focus: 'culinaria', difficulty: 'medium', xp: 25, coins: 4, attribute_gains: { corpo: 4, disciplina: 3 }, skill_category: 'culinaria', api: 'themealdb' },

  // ---------- MENTE ----------
  { id: 'mente_quiz_001', title: 'Sessão de Triagem Mental', description: 'Acesse o quiz integrado e acerte ao menos 4 de 5 questões de conhecimento geral.', category: 'mente', focus: 'estudo', difficulty: 'medium', xp: 25, coins: 4, attribute_gains: { mente: 7, foco: 3 }, api: 'opentdb' },
  { id: 'mente_leitura_001', title: 'Arquivo Aberto', description: 'Leia o resumo sobre "{article_title}": {article_extract} Registre 2 aprendizados.', category: 'mente', focus: 'leitura', difficulty: 'easy', xp: 18, coins: 2, attribute_gains: { mente: 5, foco: 2 }, api: 'wikipedia' },
  { id: 'mente_matematica_001', title: 'Ativação Numérica', description: 'Curiosidade do sistema: {math_fact} Agora estude 10 minutos de raciocínio lógico sem distrações.', category: 'mente', focus: 'matematica', difficulty: 'medium', xp: 20, coins: 3, attribute_gains: { mente: 6, foco: 4 }, skill_category: 'matematica', api: 'numbers_api' },
  { id: 'mente_idiomas_001', title: 'Expansão Lexical', description: 'Palavra de hoje: "{word}". Definição: {definition}. Crie uma frase usando esta palavra.', category: 'mente', focus: 'idiomas', difficulty: 'easy', xp: 15, coins: 2, attribute_gains: { mente: 4 }, skill_category: 'idiomas', api: 'dictionary' },
  { id: 'mente_astronomia_001', title: 'Janela para o Cosmos', description: 'Foto do dia: "{apod_title}". Atualmente há {astronaut_count} pessoas no espaço. Estude 10 min sobre o universo.', category: 'mente', focus: 'ciencias', difficulty: 'easy', xp: 18, coins: 2, attribute_gains: { mente: 5 }, skill_category: 'ciencias_naturais', api: 'nasa' },
  { id: 'mente_escrita_001', title: 'Forja de Palavras', description: 'Escreva um texto de 200 palavras sobre algo que você aprendeu esta semana. Clareza é poder.', category: 'mente', focus: 'escrita', difficulty: 'medium', xp: 22, coins: 3, attribute_gains: { mente: 6, foco: 3 }, skill_category: 'literatura' },
  { id: 'mente_deepwork_001', title: 'Bloco de Deep Work', description: 'Execute 50 minutos de trabalho focado, sem celular, em uma única tarefa importante. Depois, 10 de pausa.', category: 'foco', focus: 'deepwork', difficulty: 'hard', xp: 35, coins: 6, attribute_gains: { foco: 10, mente: 4, disciplina: 5 }, nightOnly: false },

  // ---------- EMOCIONAL ----------
  { id: 'emocional_leveza_001', title: 'Protocolo de Leveza', description: 'Piada do sistema: {joke} Identifique uma situação que mereceu mais leveza esta semana e reflita.', category: 'emocional', focus: 'autoconhecimento', difficulty: 'easy', xp: 15, coins: 2, attribute_gains: { emocional: 6 }, api: 'jokeapi' },
  { id: 'emocional_gratidao_001', title: 'Inventário de Gratidão', description: 'Escreva 3 coisas pelas quais você é grato hoje. Específicas, não genéricas.', category: 'emocional', focus: 'gratidao', difficulty: 'easy', xp: 15, coins: 2, attribute_gains: { emocional: 5, proposito: 2 } },
  { id: 'emocional_regulacao_001', title: 'Reset Respiratório', description: 'Faça 5 minutos de respiração 4-7-8 (inspire 4s, segure 7s, expire 8s). Acalme o sistema.', category: 'emocional', focus: 'regulacao', difficulty: 'easy', xp: 14, coins: 2, attribute_gains: { emocional: 5, energia: 2 }, skill_category: 'meditacao' },
  { id: 'emocional_journaling_001', title: 'Registro Interno', description: 'Escreva sobre um desafio que você superou e o que aprendeu com ele. Mín. 5 linhas.', category: 'emocional', focus: 'autoconhecimento', difficulty: 'medium', xp: 20, coins: 3, attribute_gains: { emocional: 7 } },

  // ---------- SOCIAL ----------
  { id: 'social_conexao_001', title: 'Reconexão Humana', description: 'Entre em contato com alguém importante que você não fala há tempo. Uma mensagem genuína.', category: 'social', focus: 'relacoes', difficulty: 'easy', xp: 18, coins: 3, attribute_gains: { social: 7, emocional: 2 }, weekendOnly: false },
  { id: 'social_escuta_001', title: 'Escuta Ativa', description: 'Tenha uma conversa hoje onde você ouve mais do que fala. Faça perguntas, demonstre interesse real.', category: 'social', focus: 'comunicacao', difficulty: 'medium', xp: 20, coins: 3, attribute_gains: { social: 6, emocional: 3 } },
  { id: 'social_networking_001', title: 'Expansão de Rede', description: 'Envie 1 mensagem de networking profissional ou comente algo de valor no post de alguém da sua área.', category: 'social', focus: 'networking', difficulty: 'medium', xp: 22, coins: 4, attribute_gains: { social: 6, proposito: 3 }, skill_category: 'empreendedorismo' },

  // ---------- PROPÓSITO ----------
  { id: 'proposito_reflexao_001', title: 'Bússola Interna', description: 'Reflita por 10 minutos: o que você fez hoje aproximou ou afastou você da pessoa que quer ser?', category: 'proposito', focus: 'valores', difficulty: 'easy', xp: 18, coins: 3, attribute_gains: { proposito: 7, emocional: 2 } },
  { id: 'proposito_quote_001', title: 'Sabedoria Aplicada', description: '"{quote_text}" — {quote_author}. Reflita: como aplicar isso na sua vida hoje?', category: 'proposito', focus: 'valores', difficulty: 'easy', xp: 15, coins: 2, attribute_gains: { proposito: 5 }, skill_category: 'filosofia', api: 'zenquotes' },
  { id: 'proposito_impacto_001', title: 'Ato de Impacto', description: 'Faça algo significativo por outra pessoa hoje, sem esperar nada em troca.', category: 'proposito', focus: 'impacto', difficulty: 'medium', xp: 25, coins: 4, attribute_gains: { proposito: 8, social: 4, emocional: 3 } },

  // ---------- FINANÇAS ----------
  { id: 'financas_controle_001', title: 'Análise de Mercado', description: 'Hoje: 1 BRL = {usd} USD. Registre todos os seus gastos de hoje categorizados e calcule o total.', category: 'financas', focus: 'controle', difficulty: 'easy', xp: 20, coins: 3, attribute_gains: { financas: 7, disciplina: 3 }, skill_category: 'financas', api: 'frankfurter' },
  { id: 'financas_educacao_001', title: 'Educação Financeira', description: 'Estude por 15 minutos sobre um tipo de investimento que você ainda não conhece. Anote o essencial.', category: 'financas', focus: 'investimento', difficulty: 'medium', xp: 22, coins: 4, attribute_gains: { financas: 8, mente: 2 }, skill_category: 'financas' },
  { id: 'financas_poupanca_001', title: 'Disciplina de Reserva', description: 'Separe um valor — qualquer que seja — para sua reserva hoje. Consistência supera quantidade.', category: 'financas', focus: 'poupanca', difficulty: 'easy', xp: 18, coins: 3, attribute_gains: { financas: 6, disciplina: 3 } },

  // ---------- ENERGIA / SONO ----------
  { id: 'energia_sono_001', title: 'Protocolo de Recuperação', description: 'Durma antes das 23h hoje e desligue telas 30 minutos antes. Recuperação é performance.', category: 'energia', focus: 'sono', difficulty: 'medium', xp: 22, coins: 3, attribute_gains: { energia: 8, corpo: 3 }, skill_category: 'sono', nightOnly: true },
  { id: 'energia_manha_001', title: 'Ativação Matinal', description: 'Acorde no horário planejado, sem soneca. Tome sol por 5 minutos e hidrate-se ao acordar.', category: 'energia', focus: 'vitalidade', difficulty: 'medium', xp: 20, coins: 3, attribute_gains: { energia: 7, disciplina: 4 } },

  // ---------- DISCIPLINA / ORGANIZAÇÃO ----------
  { id: 'disciplina_plano_001', title: 'Plano de Batalha', description: 'Organize seu dia em blocos de tempo. Defina as 3 tarefas mais importantes e execute na ordem.', category: 'disciplina', focus: 'organizacao', difficulty: 'medium', xp: 22, coins: 4, attribute_gains: { disciplina: 7, foco: 4 }, skill_category: 'organizacao' },
  { id: 'disciplina_ambiente_001', title: 'Ordem Externa, Ordem Interna', description: 'Organize seu espaço de trabalho ou um cômodo. Ambiente limpo, mente limpa.', category: 'disciplina', focus: 'organizacao', difficulty: 'easy', xp: 16, coins: 2, attribute_gains: { disciplina: 5, foco: 2 } },
  { id: 'disciplina_antidist_001', title: 'Quarentena Digital', description: 'Fique 2 horas sem redes sociais hoje. Use o tempo para algo que importa. O sistema detecta drenos.', category: 'disciplina', focus: 'foco', difficulty: 'hard', xp: 30, coins: 5, attribute_gains: { disciplina: 9, foco: 6 } },

  // ---------- SEGUNDA-FEIRA (planejamento) ----------
  { id: 'meta_semana_001', title: 'Planejamento Semanal', description: 'É segunda-feira. Defina suas 3 metas principais para a semana e como vai medir o sucesso.', category: 'proposito', focus: 'planejamento', difficulty: 'medium', xp: 25, coins: 4, attribute_gains: { proposito: 6, disciplina: 5, foco: 3 } },

  // ---------- FIM DE SEMANA ----------
  { id: 'weekend_social_001', title: 'Recarga Social', description: 'É fim de semana. Passe um tempo de qualidade com alguém que você ama, presente e sem celular.', category: 'social', focus: 'relacoes', difficulty: 'easy', xp: 20, coins: 3, attribute_gains: { social: 7, emocional: 4 }, weekendOnly: true },
  { id: 'weekend_relax_001', title: 'Descanso Produtivo', description: 'É fim de semana. Faça uma atividade que te recarregue de verdade — natureza, leitura, hobby. Sem culpa.', category: 'emocional', focus: 'recuperacao', difficulty: 'easy', xp: 18, coins: 3, attribute_gains: { emocional: 6, energia: 5 }, weekendOnly: true },

  // ---------- NOITE ----------
  { id: 'noite_reflexao_001', title: 'Fechamento do Dia', description: 'Antes de dormir: revise seu dia. O que funcionou? O que melhorar amanhã? 5 minutos de honestidade.', category: 'mente', focus: 'reflexao', difficulty: 'easy', xp: 15, coins: 2, attribute_gains: { mente: 4, emocional: 3, consistencia: 2 }, nightOnly: true },
]

// Challenge missions (high difficulty)
export const CHALLENGE_TEMPLATES: MissionTemplate[] = [
  { id: 'challenge_corpo', title: 'DESAFIO: Forja do Corpo', description: 'Complete um treino intenso de 45+ minutos hoje. Vá além do confortável. O corpo se constrói no desconforto.', category: 'corpo', focus: 'treino', difficulty: 'extreme', xp: 200, coins: 150, attribute_gains: { corpo: 15, disciplina: 8, energia: 5 } },
  { id: 'challenge_mente', title: 'DESAFIO: Maratona Mental', description: 'Estude um tópico complexo por 90 minutos com foco total. Faça anotações estruturadas ao final.', category: 'mente', focus: 'estudo', difficulty: 'extreme', xp: 200, coins: 150, attribute_gains: { mente: 15, foco: 10, disciplina: 6 } },
  { id: 'challenge_disciplina', title: 'DESAFIO: Dia Sem Distrações', description: 'Passe o dia inteiro sem redes sociais e cumpra TODAS as suas missões. Prove sua disciplina.', category: 'disciplina', focus: 'foco', difficulty: 'extreme', xp: 200, coins: 150, attribute_gains: { disciplina: 15, foco: 10 } },
  { id: 'challenge_financas', title: 'DESAFIO: Auditoria Total', description: 'Faça uma planilha completa de todas as suas receitas e despesas do mês. Encare os números.', category: 'financas', focus: 'controle', difficulty: 'extreme', xp: 200, coins: 150, attribute_gains: { financas: 18, disciplina: 6 } },
  { id: 'challenge_proposito', title: 'DESAFIO: Carta ao Futuro', description: 'Escreva uma carta detalhada para você daqui a 1 ano. Onde quer estar? Quem quer ser? Seja brutal e honesto.', category: 'proposito', focus: 'valores', difficulty: 'extreme', xp: 200, coins: 150, attribute_gains: { proposito: 18, emocional: 6, mente: 4 } },
]

// Weekly missions
export const WEEKLY_TEMPLATES: MissionTemplate[] = [
  { id: 'weekly_treino', title: 'Semana de Ferro', description: 'Complete 4 sessões de treino físico ao longo desta semana.', category: 'corpo', focus: 'treino', difficulty: 'hard', xp: 75, coins: 50, attribute_gains: { corpo: 12, disciplina: 8 } },
  { id: 'weekly_leitura', title: 'Imersão Intelectual', description: 'Leia por pelo menos 5 dias diferentes esta semana, mínimo 20 min cada.', category: 'mente', focus: 'leitura', difficulty: 'hard', xp: 75, coins: 50, attribute_gains: { mente: 12, foco: 6 } },
  { id: 'weekly_consistencia', title: 'Cadeia da Consistência', description: 'Complete pelo menos 1 missão diária todos os dias desta semana, sem falhar.', category: 'consistencia', focus: 'regularidade', difficulty: 'hard', xp: 75, coins: 50, attribute_gains: { consistencia: 15, disciplina: 8 } },
]
