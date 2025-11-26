import React, { useState } from 'react';
import { Box } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store credentials if remember me is checked
    if (rememberMe) {
      localStorage.setItem('openpanel_remember', 'true');
      localStorage.setItem('openpanel_email', email);
    } else {
      localStorage.removeItem('openpanel_remember');
      localStorage.removeItem('openpanel_email');
    }

    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 transform transition-all hover:scale-[1.01]">
        <div className="flex items-center justify-center gap-3 mb-8">
           <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
             <Box size={32} strokeWidth={2.5} />
           </div>
           <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Open Panel</h1>
        </div>

        <h2 className="text-center text-lg font-medium text-slate-600 mb-8">Sign In to your account</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
             <div className="relative">
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary"
              />
              <span className="text-slate-600">Remember Me</span>
            </label>
            <a href="#" className="text-primary hover:underline">Forgot your password?</a>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3.5 rounded-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95 duration-200"
          >
            Login
          </button>
        </form>

        <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>© 2024 Open Panel. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
};