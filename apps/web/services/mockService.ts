import { INITIAL_LOGS } from '../constants';
import { LogEntry } from '../types';

export const getLogs = (): Promise<LogEntry[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(INITIAL_LOGS);
    }, 500);
  });
};

export const streamLogs = (callback: (log: LogEntry) => void) => {
  const levels: ('INFO' | 'DEBUG' | 'WARN')[] = ['INFO', 'DEBUG', 'WARN'];
  const messages = [
    'Processing background job...',
    'Cache hit for user_metadata',
    'API request received GET /api/v1/status',
    'Updating metrics index',
    'Garbage collection started'
  ];

  const interval = setInterval(() => {
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const now = new Date();
    
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
      level: randomLevel,
      message: randomMessage
    };
    
    callback(newLog);
  }, 3000);

  return () => clearInterval(interval);
};
