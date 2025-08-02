'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface LogData {
  type?: string;
  logs: string;
  chatId?: string;
  logFiles?: string[];
  count?: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogData | null>(null);
  const [logType, setLogType] = useState<'general' | 'database' | 'list'>('general');
  const [specificChatId, setSpecificChatId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (type: string, chatId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (chatId) {
        params.append('chatId', chatId);
      } else {
        params.append('type', type);
      }

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setLogs(data);
      toast.success('Logs carregados com sucesso!');
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(`Erro ao carregar logs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(logType);
  }, [logType]);

  const handleSpecificChatSearch = () => {
    if (specificChatId.trim()) {
      fetchLogs('chat', specificChatId.trim());
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Chat Logs Viewer</h1>
      
      <div className="mb-6 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setLogType('general')}
              className={`px-4 py-2 rounded border ${
                logType === 'general' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Logs Gerais
            </button>
            <button
              onClick={() => setLogType('database')}
              className={`px-4 py-2 rounded border ${
                logType === 'database' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Logs do Banco
            </button>
            <button
              onClick={() => setLogType('list')}
              className={`px-4 py-2 rounded border ${
                logType === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Lista de Chats
            </button>
          </div>

          <button
            onClick={() => fetchLogs(logType)}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>

        {/* Search specific chat */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={specificChatId}
            onChange={(e) => setSpecificChatId(e.target.value)}
            placeholder="Digite um ID de chat específico..."
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSpecificChatSearch}
            disabled={loading || !specificChatId.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            Buscar Chat
          </button>
        </div>
      </div>

      {/* Logs Display */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">
          {logs?.chatId ? `Logs do Chat: ${logs.chatId}` : 
           logs?.type === 'database' ? 'Logs do Banco de Dados' :
           logs?.type === 'list' ? 'Lista de Arquivos de Log' :
           'Logs Gerais'}
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando logs...</p>
          </div>
        ) : logs ? (
          <div>
            {logs.logFiles ? (
              // Lista de arquivos
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-4">
                  Total de arquivos de log: {logs.count}
                </p>
                {logs.logFiles.length === 0 ? (
                  <p className="text-gray-500">Nenhum arquivo de log encontrado</p>
                ) : (
                  <div className="grid gap-2">
                    {logs.logFiles.map((file, index) => (
                      <div key={index} className="p-2 border rounded bg-gray-50">
                        <span className="font-mono text-sm">{file}</span>
                        <button
                          onClick={() => {
                            const chatId = file.replace('chat-', '').replace('.txt', '');
                            setSpecificChatId(chatId);
                            fetchLogs('chat', chatId);
                          }}
                          className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Ver Logs
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Logs de texto
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto whitespace-pre-wrap">
                {logs.logs || 'Nenhum log encontrado'}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Selecione um tipo de log para visualizar</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Como usar:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Logs Gerais:</strong> Todos os logs de todas as operações</li>
          <li>• <strong>Logs do Banco:</strong> Específico para operações de salvamento no banco de dados</li>
          <li>• <strong>Lista de Chats:</strong> Todos os chats que geraram logs</li>
          <li>• <strong>Chat Específico:</strong> Digite um ID de chat para ver logs apenas dele</li>
        </ul>
      </div>
    </div>
  );
}
