export const DEFAULT_CHAT_MODEL: string = 'chat-model';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'MasterKey (Ollama)',
    description: 'Modelo local MasterKey via Ollama',
  },
  {
    id: 'chat-model-reasoning',
    name: 'MasterKey - Modo Profundo',
    description: 'Modelo MasterKey com raciocínio avançado',
  },
];
