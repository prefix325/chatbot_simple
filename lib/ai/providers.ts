import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { createOllama } from 'ollama-ai-provider';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Configurar o cliente Ollama
const ollamaClient = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': ollamaClient('MasterKey:latest'),
        'chat-model-reasoning': wrapLanguageModel({
          model: ollamaClient('MasterKey:latest'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': ollamaClient('MasterKey:latest'),
        'artifact-model': ollamaClient('MasterKey:latest'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });
