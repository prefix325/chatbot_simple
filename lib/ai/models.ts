export const DEFAULT_CHAT_MODEL: string = 'chat-model';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Modelo de chat',
    description: 'Modelo de chat padrão',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Modo profundo',
    description: 'Modelo de raciocínio avançado',
  },
];
