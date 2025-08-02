'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const lastMessageCountRef = useRef(0);
  const savingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para salvar chat e mensagens com debounce
  const saveChatAndMessages = async (chatId: string, currentMessages: Array<UIMessage>) => {
    try {
      // Verificar se já está salvando para evitar chamadas duplicadas
      if (savingRef.current) {
        console.log('Save already in progress, skipping...');
        return;
      }

      savingRef.current = true;

      // Verificar se há mensagens para salvar
      if (!currentMessages || currentMessages.length === 0) {
        console.log('No messages to save, skipping database save');
        return;
      }

      console.log('Saving chat and messages to database...', { 
        chatId, 
        messageCount: currentMessages.length,
        lastMessage: currentMessages[currentMessages.length - 1]?.content || 'No content'
      });
      
      // Filtrar mensagens válidas e garantir que tenham IDs válidos
      const validMessages = currentMessages.filter(msg => 
        msg && msg.role && (msg.content || (msg.parts && msg.parts.length > 0))
      ).map(msg => ({
        ...msg,
        id: msg.id || generateUUID(), // Garantir que cada mensagem tenha um UUID válido
        createdAt: msg.createdAt || new Date().toISOString()
      }));

      if (validMessages.length === 0) {
        console.log('No valid messages to save after filtering');
        return;
      }

      console.log('Valid messages to save:', validMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content?.substring(0, 50) + '...'
      })));
      
      const response = await fetch('/api/save-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messages: validMessages
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save chat');
      }

      const result = await response.json();
      console.log('Chat saved successfully:', result);
      
    } catch (error) {
      console.error('Failed to save chat:', error);
      toast.error(`Erro ao salvar chat: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      savingRef.current = false;
    }
  };

  // Função com debounce para evitar múltiplas chamadas
  const debouncedSave = (chatId: string, currentMessages: Array<UIMessage>) => {
    // Cancelar timeout anterior se existir
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Criar novo timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveChatAndMessages(chatId, currentMessages);
    }, 1000); // Debounce de 1 segundo
  };

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: (message, options) => {
      console.log('Chat finished successfully');
      console.log('onFinish - message:', message);
      console.log('onFinish - current messages count:', messages.length);
      console.log('onFinish - options:', options);
      
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      
      // Usar debounce para evitar múltiplas chamadas
      const getAllMessages = () => {
        const allMessages = [...messages];
        
        if (message && message.role === 'assistant') {
          const messageExists = allMessages.some(m => m.id === message.id);
          if (!messageExists) {
            const uiMessage: UIMessage = {
              ...message,
              parts: message.parts || (message.content ? [{ type: 'text', text: message.content }] : [])
            };
            allMessages.push(uiMessage);
          }
        }
        
        return allMessages;
      };
      
      const currentMessages = getAllMessages();
      console.log('onFinish - triggering debounced save with messages:', currentMessages.length);
      debouncedSave(id, currentMessages);
    },
    onResponse: (response) => {
      console.log('Chat API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: response.headers,
        url: response.url
      });
    },
    onError: (error) => {
      console.error('=== CHAT ERROR DEBUG ===');
      console.error('Chat error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error cause:', error.cause);
      console.error('Current status:', status);
      console.error('Messages count:', messages.length);
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Log do contexto adicional 
      console.error('useChat id:', id);
      console.error('selectedChatModel:', selectedChatModel);
      console.error('initialMessages:', initialMessages);
      
      // Verificar se é um erro de rede
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network fetch error detected');
      } else if (error.message.includes('stream')) {
        console.error('Stream processing error detected');
      } else if (error.message.includes('An error occurred')) {
        console.error('Generic AI SDK error detected - check backend logs');
      }
      
      // Verificar o tipo de erro para fornecer mensagens mais específicas
      let errorMessage = 'Erro desconhecido';
      if (error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão com o servidor';
      } else if (error.message.includes('Ollama')) {
        errorMessage = 'Erro de comunicação com o modelo de IA';
      } else if (error.message.includes('stream')) {
        errorMessage = 'Erro no stream de dados';
      } else if (error.message.includes('An error occurred')) {
        errorMessage = 'Erro interno do servidor - verifique os logs';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Tempo limite excedido - tente novamente';
      } else if (error.message.includes('network')) {
        errorMessage = 'Erro de rede - verifique sua conexão';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Erro no chat: ${errorMessage}`);
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Efeito para detectar mudanças nas mensagens e salvar automaticamente
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && messages.length > 1) {
      console.log('New messages detected, triggering debounced save...', {
        previousCount: lastMessageCountRef.current,
        currentCount: messages.length
      });
      
      // Usar debounce em vez de timeout direto
      debouncedSave(id, messages);
    }
    
    lastMessageCountRef.current = messages.length;
  }, [messages.length, id]);

  // Cleanup do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
