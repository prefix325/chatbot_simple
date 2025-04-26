'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import { UseChatHelpers } from '@ai-sdk/react';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Verso Bíblico do Dia',
      label: 'Alimento diário das Escrituras?',
      action:
        'Me mostre um versículo da Bíblia com uma explicação e aplicação para hoje.',
    },
    {
      title: 'Responder uma Dúvida Teológica',
      label: `Pergunte e aprenda com as Escrituras`,
      action: `Como Paulo explica a justificação pela fé em Romanos 5:1-2?`,
    },
    {
      title: 'Confissões Reformadas',
      label: `Fé histórica, verdade presente`,
      action: `Mostre um trecho de uma confissão reformada e explique o que significa.`,
    },
    {
      title: 'Devocional Diário',
      label: 'Coração aquecido pela Palavra',
      action:
        'Quero um devocional curto com um versículo, explicação e oração.',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
