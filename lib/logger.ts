import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Garantir que o diretório de logs existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export interface ChatLog {
  timestamp: string;
  chatId: string;
  level: 'info' | 'error' | 'warning' | 'debug';
  message: string;
  data?: any;
}

export class ChatLogger {
  private chatId: string;

  constructor(chatId: string) {
    this.chatId = chatId;
  }

  private writeLog(level: ChatLog['level'], message: string, data?: any) {
    const logEntry: ChatLog = {
      timestamp: new Date().toISOString(),
      chatId: this.chatId,
      level,
      message,
      data
    };

    // Log para arquivo específico do chat
    const chatLogFile = path.join(LOG_DIR, `chat-${this.chatId}.txt`);
    const logLine = `[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}${data ? '\n  Data: ' + JSON.stringify(data, null, 2) : ''}\n`;
    
    try {
      fs.appendFileSync(chatLogFile, logLine);
    } catch (error) {
      console.error('Failed to write to chat log file:', error);
    }

    // Log para arquivo geral também
    const generalLogFile = path.join(LOG_DIR, 'general.txt');
    const generalLogLine = `[${logEntry.timestamp}] [CHAT:${this.chatId}] [${level.toUpperCase()}] ${message}\n`;
    
    try {
      fs.appendFileSync(generalLogFile, generalLogLine);
    } catch (error) {
      console.error('Failed to write to general log file:', error);
    }

    // Também log no console para desenvolvimento
    console.log(`[CHAT:${this.chatId}] [${level.toUpperCase()}] ${message}`, data || '');
  }

  info(message: string, data?: any) {
    this.writeLog('info', message, data);
  }

  error(message: string, data?: any) {
    this.writeLog('error', message, data);
  }

  warning(message: string, data?: any) {
    this.writeLog('warning', message, data);
  }

  debug(message: string, data?: any) {
    this.writeLog('debug', message, data);
  }
}

// Função para obter logs de um chat específico
export function getChatLogs(chatId: string): string | null {
  const chatLogFile = path.join(LOG_DIR, `chat-${chatId}.txt`);
  
  try {
    if (fs.existsSync(chatLogFile)) {
      return fs.readFileSync(chatLogFile, 'utf-8');
    }
    return null;
  } catch (error) {
    console.error('Failed to read chat log file:', error);
    return null;
  }
}

// Função para listar todos os logs de chat
export function getAllChatLogFiles(): string[] {
  try {
    const files = fs.readdirSync(LOG_DIR);
    return files.filter(file => file.startsWith('chat-') && file.endsWith('.txt'));
  } catch (error) {
    console.error('Failed to list log files:', error);
    return [];
  }
}

// Função para logging de salvamento no banco de dados
export function logDatabaseOperation(operation: string, chatId: string, success: boolean, error?: any) {
  const dbLogFile = path.join(LOG_DIR, 'database.txt');
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCCESS' : 'FAILED';
  const errorInfo = error ? `\n  Error: ${error.message || error}` : '';
  
  const logLine = `[${timestamp}] [${status}] ${operation} for chat ${chatId}${errorInfo}\n`;
  
  try {
    fs.appendFileSync(dbLogFile, logLine);
  } catch (logError) {
    console.error('Failed to write to database log file:', logError);
  }
  
  console.log(`[DATABASE] [${status}] ${operation} for chat ${chatId}`, error || '');
}
