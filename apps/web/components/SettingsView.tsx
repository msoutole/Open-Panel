
import React, { useState } from 'react';
import { USERS_MOCK } from '../constants';
import { Shield, Key, User, HardDrive, GitBranch, Terminal, Cpu, Box, Trash2, Plus, Server, Activity, Github, Gitlab, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
  const [isBackupTesting, setIsBackupTesting] = useState(false);
  const [showGitForm, setShowGitForm] = useState(false);
  const [backupProvider, setBackupProvider] = useState<'s3' | 'backblaze' | 'local'>('s3');
  const [backupConfig, setBackupConfig] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    region: '',
    endpoint: ''
  });

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
          const providerName = backupProvider === 's3' ? 'S3-compatible storage' :
                               backupProvider === 'backblaze' ? 'Backblaze B2' : 'Local filesystem';
          alert(`Connection successful! ${providerName} settings saved.`);
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

  const handleAddBuilder = () => {
      const name = prompt("Builder Name (e.g., Heavy Worker):");
      if (!name) return;
      setBuilders([...builders, {
          id: `b_${Date.now()}`,
          name,
          cpuLimitCores: 2,
          memoryLimitMB: 4096,
          swapLimitMB: 8192,
          status: 'Ready'
      }]);
  };

  const handleRemoveBuilder = (id: string) => {
    if (confirm("Remove this build environment?")) {
        setBuilders(builders.filter(b => b.id !== id));
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
                        <label
                            className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                                backupProvider === 's3'
                                    ? 'border-blue-200 bg-blue-50/50 ring-1 ring-blue-200'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            onClick={() => setBackupProvider('s3')}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 ${
                                backupProvider === 's3'
                                    ? 'border-4 border-blue-500 bg-white'
                                    : 'border-slate-300'
                            }`}></div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-800">S3 Compatible Storage</div>
                                <div className="text-xs text-slate-500">AWS S3, MinIO, DigitalOcean Spaces</div>
                            </div>
                            <HardDrive size={20} className={backupProvider === 's3' ? 'text-blue-500' : 'text-slate-400'} />
                        </label>

                        <label
                            className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                                backupProvider === 'backblaze'
                                    ? 'border-orange-200 bg-orange-50/50 ring-1 ring-orange-200'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            onClick={() => setBackupProvider('backblaze')}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 ${
                                backupProvider === 'backblaze'
                                    ? 'border-4 border-orange-500 bg-white'
                                    : 'border-slate-300'
                            }`}></div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-800">Backblaze B2</div>
                                <div className="text-xs text-slate-500">Cost-effective cloud storage</div>
                            </div>
                            <HardDrive size={20} className={backupProvider === 'backblaze' ? 'text-orange-500' : 'text-slate-400'} />
                        </label>

                        <label
                            className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                                backupProvider === 'local'
                                    ? 'border-slate-400 bg-slate-50 ring-1 ring-slate-300'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            onClick={() => setBackupProvider('local')}
                        >
                            <div className={`w-4 h-4 rounded-full border-2 ${
                                backupProvider === 'local'
                                    ? 'border-4 border-slate-500 bg-white'
                                    : 'border-slate-300'
                            }`}></div>
                            <div className="flex-1">
                                <div className="text-sm font-bold text-slate-800">Local Filesystem</div>
                                <div className="text-xs text-slate-500">Not recommended for production</div>
                            </div>
                            <Server size={20} className={backupProvider === 'local' ? 'text-slate-500' : 'text-slate-400'} />
                        </label>
                    </div>

                    {(backupProvider === 's3' || backupProvider === 'backblaze') && (
                        <div className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">
                                    {backupProvider === 'backblaze' ? 'Application Key ID' : 'Access Key ID'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={backupProvider === 'backblaze' ? 'Your B2 Application Key ID' : 'Your AWS Access Key ID'}
                                    value={backupConfig.accessKeyId}
                                    onChange={(e) => setBackupConfig({...backupConfig, accessKeyId: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">
                                    {backupProvider === 'backblaze' ? 'Application Key' : 'Secret Access Key'}
                                </label>
                                <input
                                    type="password"
                                    placeholder={backupProvider === 'backblaze' ? 'Your B2 Application Key' : 'Your AWS Secret Access Key'}
                                    value={backupConfig.secretAccessKey}
                                    onChange={(e) => setBackupConfig({...backupConfig, secretAccessKey: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Bucket Name</label>
                                    <input
                                        type="text"
                                        placeholder={backupProvider === 'backblaze' ? 'my-b2-bucket' : 'my-s3-bucket'}
                                        value={backupConfig.bucketName}
                                        onChange={(e) => setBackupConfig({...backupConfig, bucketName: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Region</label>
                                    <input
                                        type="text"
                                        placeholder={backupProvider === 'backblaze' ? 'us-west-004' : 'us-east-1'}
                                        value={backupConfig.region}
                                        onChange={(e) => setBackupConfig({...backupConfig, region: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">Endpoint URL</label>
                                <input
                                    type="text"
                                    placeholder={backupProvider === 'backblaze' ? 'https://s3.us-west-004.backblazeb2.com' : 'https://s3.amazonaws.com'}
                                    value={backupConfig.endpoint}
                                    onChange={(e) => setBackupConfig({...backupConfig, endpoint: e.target.value})}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}
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
            {/* Builders Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Box className="text-slate-500" size={18} />
                        <h3 className="font-semibold text-slate-700">Build Environments</h3>
                    </div>
                    <button 
                        onClick={handleAddBuilder}
                        className="flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        <Plus size={14} /> New Builder
                    </button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRemoveBuilder(builder.id); }}
                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={handleAddBuilder}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-slate-50/50 transition-all h-32"
                        >
                            <Plus size={24} className="mb-2 opacity-50" />
                            <span className="text-xs font-bold">Add Environment</span>
                        </button>
                    </div>
                </div>
            </section>

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
                            <span className="text-xs text-slate-400">GitHub or GitLab Personal Access Token</span>
                         </button>
                     </div>
                </div>
            </section>
        </div>
      )}
    </div>
  );
};
