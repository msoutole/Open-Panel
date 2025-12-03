import React from 'react';
import { PostgresConsole } from './PostgresConsole';
import { MysqlConsole } from './MysqlConsole';
import { RedisConsole } from './RedisConsole';
import { MongoConsole } from './MongoConsole';

interface DatabaseConsoleProps {
  containerId: string;
  type: 'postgresql' | 'mysql' | 'mariadb' | 'redis' | 'mongodb' | string;
}

export const DatabaseConsole: React.FC<DatabaseConsoleProps> = ({ containerId, type }) => {
  switch (type) {
    case 'postgresql':
    case 'postgres':
      return <PostgresConsole containerId={containerId} type="postgresql" />;
    case 'mysql':
    case 'mariadb':
      return <MysqlConsole containerId={containerId} />;
    case 'redis':
      return <RedisConsole containerId={containerId} />;
    case 'mongodb':
    case 'mongo':
      return <MongoConsole containerId={containerId} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          Console not supported for database type: {type}
        </div>
      );
  }
};
