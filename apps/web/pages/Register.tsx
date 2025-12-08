import React from 'react';
import { Logo } from '../components/ui/Logo';

export const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" className="mb-4" />
          <h2 className="text-center text-base font-semibold text-textPrimary mb-1">Crie sua conta</h2>
          <p className="text-center text-sm text-textSecondary">Seu Servidor mais inteligente.</p>
        </div>
      </div>
    </div>
  );
};
