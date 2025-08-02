import { NextRequest } from 'next/server';
import { getChatLogs, getAllChatLogFiles } from '@/lib/logger';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const logType = searchParams.get('type') || 'general';

    const LOG_DIR = path.join(process.cwd(), 'logs');

    if (chatId) {
      // Retornar logs específicos de um chat
      const chatLogs = getChatLogs(chatId);
      if (!chatLogs) {
        return new Response(JSON.stringify({
          error: `No logs found for chat ${chatId}`,
          chatId
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        chatId,
        logs: chatLogs
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (logType === 'list') {
      // Listar todos os arquivos de log
      const logFiles = getAllChatLogFiles();
      return new Response(JSON.stringify({
        logFiles,
        count: logFiles.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (logType === 'database') {
      // Retornar logs do banco de dados
      const dbLogFile = path.join(LOG_DIR, 'database.txt');
      try {
        const dbLogs = fs.readFileSync(dbLogFile, 'utf-8');
        return new Response(JSON.stringify({
          type: 'database',
          logs: dbLogs
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          type: 'database',
          logs: 'No database logs found yet'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Retornar logs gerais
    const generalLogFile = path.join(LOG_DIR, 'general.txt');
    try {
      const generalLogs = fs.readFileSync(generalLogFile, 'utf-8');
      return new Response(JSON.stringify({
        type: 'general',
        logs: generalLogs
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        type: 'general',
        logs: 'No general logs found yet'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error fetching logs:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
