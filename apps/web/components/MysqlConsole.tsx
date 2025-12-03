import React from 'react';
import { PostgresConsole } from './PostgresConsole';

interface MysqlConsoleProps {
  containerId: string;
}

export const MysqlConsole: React.FC<MysqlConsoleProps> = ({ containerId }) => {
  return <PostgresConsole containerId={containerId} type="mysql" />;
};
