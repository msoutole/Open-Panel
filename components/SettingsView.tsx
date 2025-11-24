import React, { useState } from 'react';
import { USERS_MOCK } from '../constants';
import { Shield, Key, User, HardDrive, GitBranch, Terminal, Cpu, Box, Trash2, Plus, Brain, Sparkles, Network, Zap, Server, Activity, Command, Github, Gitlab, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { DockerBuilder, GitToken } from '../types';

interface SettingsViewProps {
  view: 'settings' | 'users' | 'backups';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ view }) => {
  // State for Lists
  const [builders, setBuilders] = useState<DockerBuilder[]>([
      { id: 'b1', name: 'Standard Builder', cpuLimitCores: 2, memoryLimitMB: 2048, swapLimitMB: 4096, status: 'Ready' },
      { id: 'b2', name: 'High-Perf Builder', cpuLimitCores: 8, memoryLimitMB: 8192, swapLimitMB: 16384, status: 'Busy' }
  ]);
  
  const [gitTokens, setGitTokens] = useState<GitToken[]>([
    { id: 'gt_1', name: 'OpenPanel Bot', provider: 'github', username: 'openpanel-bot', tokenMasked: 'ghp_●●●●●●●●●●●●●●●●', createdAt: '2023-10-01', status: 'active' }
  ]);

  const [users, setUsers] = useState(USERS_MOCK);
  const [userSearch, setUserSearch] = useState('');

  // Form States
  const [aiProvider, setAiProvider] = useState('google');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [isBackupTesting, setIsBackupTesting] = useState(false);
  const [isAiTesting, setIsAiTesting] = useState(false);
  const [showGitForm, setShowGitForm] = useState(false);

  const providers = [
      { id: 'google', name: 'Google Gemini', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', desc: 'Multimodal, high context window.' },
      { id: 'openai', name: 'OpenAI GPT-4', icon:  Brain, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', desc: 'Standard reasoning & logic.' },
      { id: 'anthropic', name: 'Anthropic Claude', icon: Box, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Best for coding & creative.' },
      { id: 'groq', name: 'Groq Cloud', icon: Zap, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', desc: 'Ultra-low latency inference.' },
      { id: 'ollama', name: 'Ollama (Local)', icon: Server, color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300', desc: 'Privacy-first local LLMs.' },
  ];

  // Actions
  const handleInviteUser = () => {
      const email = prompt("Enter email address to invite:");
      if (email) {
          alert(`Invitation sent to ${email}`);
          // Mock adding user
          setUsers([...users, {
              id: `u_${Date.now()}`,
              name: 'Pending User',
              email: email,
              role: 'user',
              twoFactorEnabled: false,
              lastLogin: 'Never'
          }]);
      }
  };

  const handleSaveBackups = () => {
      setIsBackupTesting(true);
      setTimeout(() => {
          setIsBackupTesting(false);
          alert("Connection successful! S3 settings saved.");
      }, 1500);
  };

  const handleTestAi = () => {
      setIsAiTesting(true);
      setTimeout(() => {
          setIsAiTesting(false);
          alert("AI Provider Connected Successfully!");
      }, 1500);
  };

  const handleAddGitToken = () => {
      setGitTokens([...gitTokens, {
          id: `gt_${Date.now()}`,
          name: 'New Git Connection',
          provider: 'github',
          username: 'user-added',
          tokenMasked: 'ghp_newtoken●●●●●●',
          createdAt: new Date().toISOString().split('T')[0],
          status: 'active'
      }]);
      setShowGitForm(false);
  };

  const handleRemoveToken = (id: string) => {
      if (confirm("Revoke this token?")) {
          setGitTokens(gitTokens.filter(t => t.id !== id));
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32">
      
      {/* Dynamic Header based on view */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          {view === 'users' ? 'Identity & Access Management' : 
           view === 'backups' ? 'Backup & Data Recovery' : 
           'System Configuration'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
           {view === 'users' ? 'Manage organization members, RBAC roles, and API access tokens.' : 
           view === 'backups' ? 'Configure snapshot schedules, retention policies, and S3 storage.' : 
           'Global infrastructure settings, AI Provider selection, and MCP orchestration.'}
        </p>
      </div>

      {/* IAM Section - Only shown when view is 'users' */}
      {view === 'users' && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <User size={18} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">Users & Roles</h3>
                    <p className="text-xs text-slate-500">Active team members</p>
                </div>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                        />
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <button 
                        onClick={handleInviteUser}
                        className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow-sm shadow-blue-200 font-medium transition-colors"
                    >
                        Invite Member
                    </button>
                </div>
                <table className="w-full text-sm">
                    <thead className="text-xs uppercase text-slate-400 font-bold bg-slate-50/50 rounded-lg">
                        <tr>
                            <th className="text-left py-3 px-4 first:rounded-l-lg">User Details</th>
                            <th className="text-left py-3 px-4">Role</th>
                            <th className="text-left py-3 px-4">Security</th>
                            <th className="text-right py-3 px-4">Last Activity</th>
                            <th className="text-right py-3 px-4 last:rounded-r-lg">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    {user.twoFactorEnabled ? (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded w-fit border border-green-200">
                                            <Shield size={10} strokeWidth={3} /> MFA Active
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded w-fit border border-red-200">
                                            <Activity size={10} /> Risky
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-right text-slate-500 font-mono text-xs">{user.lastLogin}</td>
                                <td className="py-4 px-4 text-right">
                                    <button className="text-slate-400 hover:text-primary transition-colors"><Terminal size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
      )}

      {/* Backups Section - Only shown when view is 'backups' */}
      {view === 'backups' && (
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <HardDrive size={18} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800">Storage & Retention</h3>
                    <p className="text-xs text-slate-500">Manage disaster recovery</p>
                </div>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Storage Provider</h4>
                    
                    <div className="space-y-3">
                        <label className="flex items-center gap-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl cursor-pointer ring-1 ring-blue-200 relative">
                            <div className="w-4 h-4 rounded-full border-4 border-blue-500 bg-white"></div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-800">S3 Compatible Storage</div>
                                <div className="text-xs text-slate-500">AWS S3, MinIO, DigitalOcean Spaces</div>
                            </div>
                            <HardDrive size={20} className="text-blue-500" />
                        </label>
                        
                        <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-colors opacity-60">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-800">Local Filesystem</div>
                                <div className="text-xs text-slate-500">Not recommended for production</div>
                            </div>
                            <Server size={20} className="text-slate-400" />
                        </label>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Bucket Name</label>
                                <input type="text" placeholder="my-backups" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Region</label>
                                <input type="text" placeholder="us-east-1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500">Endpoint URL</label>
                            <input type="text" placeholder="https://s3.amazonaws.com" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Snapshot Policy</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Automated Backups</span>
                            <div className="relative inline-block w-10 h-6 bg-green-500 rounded-full cursor-pointer">
                                <span className="absolute right-1 top-1 inline-block w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                            </div>
                        </div>
                        <div className="h-px bg-slate-200"></div>
                        <div>
                             <label className="text-xs font-semibold text-slate-500 mb-2 block">Frequency</label>
                             <div className="grid grid-cols-3 gap-2">
                                 {['Hourly', 'Daily', 'Weekly'].map(f => (
                                     <button key={f} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${f === 'Daily' ? 'bg-white border-blue-300 text-blue-600 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-200'}`}>
                                         {f}
                                     </button>
                                 ))}
                             </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600">Retention Period</span>
                                <span className="font-bold text-slate-800">7 Days</span>
                            </div>
                            <input type="range" className="w-full h-1.5 bg-slate-200 rounded-full appearance-none accent-blue-600 cursor-pointer" />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveBackups}
                        disabled={isBackupTesting}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                    >
                        {isBackupTesting ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isBackupTesting ? 'Testing Connection...' : 'Save & Test Connection'}
                    </button>
                </div>
            </div>
        </section>
      )}

      {/* Infrastructure Section - Only shown when view is 'settings' */}
      {view === 'settings' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* AI Provider Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="text-indigo-500" size={24} />
                                <h3 className="text-xl font-bold text-slate-800">Intelligence Provider</h3>
                            </div>
                            <p className="text-slate-500 text-sm max-w-xl">Select the underlying LLM engine for the Nexus Agent. This controls cost, speed, and reasoning capabilities.</p>
                        </div>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase rounded-full border border-indigo-100">
                            Active: {providers.find(p => p.id === aiProvider)?.name}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {providers.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => setAiProvider(provider.id)}
                                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group hover:shadow-md ${
                                    aiProvider === provider.id 
                                    ? `${provider.bg} ${provider.border} ring-1 ring-offset-0 ring-indigo-500/20` 
                                    : 'bg-white border-slate-100 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2.5 rounded-lg ${provider.bg}`}>
                                        <provider.icon size={20} className={provider.color} />
                                    </div>
                                    {aiProvider === provider.id && (
                                        <div className="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-sm"></div>
                                    )}
                                </div>
                                <h4 className={`font-bold text-sm mb-1 ${aiProvider === provider.id ? 'text-slate-900' : 'text-slate-700'}`}>{provider.name}</h4>
                                <p className="text-xs text-slate-500 leading-relaxed">{provider.desc}</p>
                            </button>
                        ))}
                    </div>

                    {/* Conditional Configuration for Providers */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        {aiProvider === 'ollama' ? (
                            <div className="flex items-center gap-4 animate-in fade-in">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Ollama Endpoint</label>
                                    <input 
                                        type="text" 
                                        value={ollamaUrl}
                                        onChange={(e) => setOllamaUrl(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none" 
                                    />
                                </div>
                                <div className="pt-5">
                                    <button 
                                        onClick={handleTestAi}
                                        disabled={isAiTesting}
                                        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex gap-2"
                                    >
                                        {isAiTesting && <Loader2 size={16} className="animate-spin" />}
                                        Test Connection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 animate-in fade-in">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">API Key ({providers.find(p => p.id === aiProvider)?.name})</label>
                                    <div className="relative">
                                        <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="password" 
                                            placeholder="sk-..." 
                                            className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all" 
                                        />
                                    </div>
                                </div>
                                <div className="pt-5">
                                    <button 
                                        onClick={() => alert("Secret saved securely.")}
                                        className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        Save Secret
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* MCP Status Panel */}
                <div className="lg:col-span-1">
                    <section className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-slate-800/50 bg-slate-950/30">
                            <div className="flex items-center gap-3 mb-2">
                                <Network className="text-emerald-400" size={20} />
                                <h3 className="font-bold text-white">MCP Protocol</h3>
                            </div>
                            <p className="text-slate-400 text-xs">Model Context Protocol Bridge Status</p>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-sm font-medium">Server Status</span>
                                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Online
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Listening Port</span>
                                        <span className="font-mono text-slate-300">8080</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-px"></div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Registered Tools</span>
                                        <span className="font-mono text-slate-300">7</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-px"></div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Capabilities</span>
                                        <span className="text-slate-300">FS, Shell, Docker</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors border border-slate-700 flex items-center justify-center gap-2">
                                    <Terminal size={14} /> View Tool Definitions
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Builders Section */}
                <div className="lg:col-span-2">
                    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Box className="text-slate-500" size={18} />
                                <h3 className="font-semibold text-slate-700">Build Environments</h3>
                            </div>
                            <button className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                                <Plus size={14} /> New Builder
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {builders.map(builder => (
                                    <div key={builder.id} className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between group hover:border-primary/50 transition-colors bg-white hover:shadow-md cursor-pointer h-32">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{builder.name}</h4>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${builder.status === 'Ready' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                {builder.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex gap-3 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Cpu size={12}/> {builder.cpuLimitCores} vCPU</span>
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><HardDrive size={12}/> {builder.memoryLimitMB / 1024}GB</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 text-slate-400 hover:text-red-500 rounded"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-slate-50/50 transition-all h-32">
                                    <Plus size={24} className="mb-2 opacity-50" />
                                    <span className="text-xs font-bold">Add Environment</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* GitOps Integration Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                         <GitBranch className="text-slate-500" size={18} />
                         <h3 className="font-semibold text-slate-700">GitOps & Version Control</h3>
                     </div>
                     <button 
                        onClick={() => setShowGitForm(true)}
                        className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                     >
                         <Plus size={14} /> Connect Provider
                     </button>
                </div>
                
                {showGitForm && (
                     <div className="bg-slate-50 p-6 border-b border-slate-100 flex gap-4 animate-in slide-in-from-top-2">
                        <div className="flex-1 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800">Add New Provider</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Provider Name (e.g. My Github)" className="border border-slate-300 rounded px-3 py-2 text-sm" />
                                <input type="text" placeholder="Personal Access Token" className="border border-slate-300 rounded px-3 py-2 text-sm" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleAddGitToken} className="bg-primary text-white text-xs px-4 py-2 rounded font-medium">Connect Account</button>
                                <button onClick={() => setShowGitForm(false)} className="text-slate-500 text-xs px-4 py-2 hover:bg-slate-200 rounded font-medium">Cancel</button>
                            </div>
                        </div>
                     </div>
                )}

                <div className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {gitTokens.map(token => (
                             <div key={token.id} className="border border-slate-200 rounded-xl p-5 flex flex-col group hover:border-primary/50 transition-colors bg-white shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                     <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                             {token.provider === 'github' ? <Github size={20} className="text-slate-800" /> : <Gitlab size={20} className="text-orange-600" />}
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-slate-800 text-sm">{token.name}</h4>
                                             <div className="flex items-center gap-1 text-xs text-slate-500">
                                                 <span>@{token.username}</span>
                                             </div>
                                         </div>
                                     </div>
                                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border flex items-center gap-1 ${token.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                         {token.status === 'active' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                         {token.status}
                                     </span>
                                 </div>
                                 
                                 <div className="mt-auto">
                                     <div className="bg-slate-50 rounded-lg p-2.5 mb-3 font-mono text-xs text-slate-500 flex justify-between items-center border border-slate-100">
                                         <span>{token.tokenMasked}</span>
                                         <span className="text-[10px] uppercase font-bold text-slate-400">PAT</span>
                                     </div>
                                     <div className="flex items-center justify-between">
                                         <span className="text-xs text-slate-400">Added {token.createdAt}</span>
                                         <div className="flex gap-1">
                                             <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Sync">
                                                 <RefreshCw size={14} />
                                             </button>
                                             <button 
                                                onClick={() => handleRemoveToken(token.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" 
                                                title="Remove"
                                            >
                                                 <Trash2 size={14} />
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                         
                         <button 
                            onClick={() => setShowGitForm(true)}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-slate-50/50 transition-all min-h-[160px]"
                         >
                            <div className="flex gap-2 mb-3">
                                <Github size={20} className="opacity-50" />
                                <Gitlab size={20} className="opacity-50" />
                            </div>
                            <span className="text-xs font-bold mb-1">Link New Account</span>
                            <span className="text-[10px] text-slate-400">GitHub or GitLab Personal Access Token</span>
                         </button>
                     </div>
                </div>
            </section>
        </div>
      )}
    </div>
  );
};