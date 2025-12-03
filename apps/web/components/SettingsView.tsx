
import React, { useState, useEffect } from 'react';
import { getUsers, deleteUser } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useTranslations } from '../src/i18n/i18n-react';
import { Shield, Key, User as UserIcon, HardDrive, GitBranch, Terminal, Cpu, Box, Trash2, Plus, Server, Activity, Github, Gitlab, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { DockerBuilder, GitToken } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

// Define User type locally to avoid Rollup export issues
type User = {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  avatar?: string;
  status?: string;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  lastLogin?: string;
  lastLoginAt?: string;
};

interface SettingsViewProps {
    view: 'settings' | 'users' | 'backups';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ view }) => {
    const LL = useTranslations();
    // State for Lists
    const [builders, setBuilders] = useState<DockerBuilder[]>([
        { id: 'b1', name: 'Standard Builder', cpuLimitCores: 2, memoryLimitMB: 2048, swapLimitMB: 4096, status: 'Ready' },
        { id: 'b2', name: 'High-Perf Builder', cpuLimitCores: 8, memoryLimitMB: 8192, swapLimitMB: 16384, status: 'Busy' }
    ]);

    const [gitTokens, setGitTokens] = useState<GitToken[]>([
        { id: 'gt_1', name: 'OpenPanel Bot', provider: 'github', username: 'openpanel-bot', tokenMasked: 'ghp_●●●●●●●●●●●●●●●●', createdAt: '2023-10-01', status: 'active' }
    ]);

    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);
    const { showToast } = useToast();

    // Fetch users from API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoadingUsers(true);
                setUsersError(null);
                const data = await getUsers();
                setUsers(data);
            } catch (error) {
                console.error('Failed to load users', error);
                const errorMsg = error instanceof Error ? error.message : 'Failed to load users';
                setUsersError(errorMsg);
                showToast({
                    type: 'error',
                    title: 'Erro ao carregar usuários',
                    message: errorMsg,
                });
            } finally {
                setIsLoadingUsers(false);
            }
        };
        
        if (view === 'users') {
            fetchUsers();
        }
    }, [view, showToast]);

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
    const handleInviteUser = async () => {
        const email = prompt("Enter email address to invite:");
        if (email) {
            try {
                // TODO: Implement invite user API endpoint
                // For now, just show a message
                alert(`Invitation functionality will be implemented. Email: ${email}`);
                // Refresh users list
                const data = await getUsers();
                setUsers(data);
            } catch (error) {
                console.error('Failed to invite user', error);
                alert('Failed to invite user. Please try again.');
            }
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            await deleteUser(userId);
            // Refresh users list
            const data = await getUsers();
            setUsers(data);
            showToast({
                type: 'success',
                title: 'Usuário removido',
                message: `O usuário "${userName}" foi removido com sucesso`,
            });
        } catch (error) {
            console.error('Failed to delete user', error);
            showToast({
                type: 'error',
                title: 'Erro ao remover usuário',
                message: error instanceof Error ? error.message : 'Não foi possível remover o usuário',
            });
        }
    };

    const handleSaveBackups = () => {
        setIsBackupTesting(true);
        setTimeout(() => {
            setIsBackupTesting(false);
            const providerName = backupProvider === 's3' ? LL.settings.s3CompatibleStorage() :
                backupProvider === 'backblaze' ? LL.settings.backblazeB2() : LL.settings.localFilesystem();
            alert(LL.settings.connectionSuccessful({ provider: providerName }));
        }, 1500);
    };

    const handleAddGitToken = () => {
        setGitTokens([...gitTokens, {
            id: `gt_${Date.now()}`,
            name: LL.settings.newGitConnection(),
            provider: 'github',
            username: 'user-added',
            tokenMasked: 'ghp_newtoken●●●●●●',
            createdAt: new Date().toISOString().split('T')[0] || '',
            status: 'active'
        }]);
        setShowGitForm(false);
    };

    const handleRemoveToken = (id: string) => {
        if (confirm(LL.settings.revokeToken())) {
            setGitTokens(gitTokens.filter(t => t.id !== id));
        }
    };

    const handleAddBuilder = () => {
        const name = prompt(LL.settings.builderName());
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
        if (confirm(LL.settings.removeBuildEnvironment())) {
            setBuilders(builders.filter(b => b.id !== id));
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-16 sm:pb-32">

            {/* Dynamic Header based on view */}
            <div>
                <h2 className="text-2xl font-bold text-textPrimary tracking-tight">
                    {view === 'users' ? LL.settings.identityAccessManagement() :
                        view === 'backups' ? LL.settings.backupDataRecovery() :
                            LL.settings.systemConfiguration()}
                </h2>
                <p className="text-textSecondary text-sm mt-1">
                    {view === 'users' ? LL.settings.identityAccessManagementDesc() :
                        view === 'backups' ? LL.settings.backupDataRecoveryDesc() :
                            LL.settings.systemConfigurationDesc()}
                </p>
            </div>

            {/* IAM Section - Only shown when view is 'users' */}
            {view === 'users' && (
                <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-background flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <UserIcon size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-textPrimary">{LL.settings.usersRoles()}</h3>
                            <p className="text-xs text-textSecondary">{LL.settings.activeTeamMembers()}</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="relative w-full sm:w-64">
                                <UserIcon size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary z-10" />
                                <Input
                                    type="text"
                                    placeholder={LL.settings.searchUsers()}
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button
                                onClick={() => void handleInviteUser()}
                                variant="primary"
                                size="sm"
                            >
                                <Plus size={16} strokeWidth={1.5} />
                                {LL.settings.addUser()}
                            </Button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-textSecondary font-medium bg-background rounded-lg">
                                <tr>
                                    <th className="text-left py-3 px-4 first:rounded-l-lg">{LL.settings.userDetails()}</th>
                                    <th className="text-left py-3 px-4">{LL.settings.role()}</th>
                                    <th className="text-left py-3 px-4">{LL.security.status()}</th>
                                    <th className="text-right py-3 px-4">{LL.settings.lastActivity()}</th>
                                    <th className="text-right py-3 px-4 last:rounded-r-lg">{LL.settings.action()}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoadingUsers ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <Loader2 size={24} strokeWidth={1.5} className="animate-spin text-textSecondary mx-auto mb-2" />
                                            <p className="text-sm text-textSecondary">{LL.settings.loadingUsers()}</p>
                                        </td>
                                    </tr>
                                ) : usersError ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <AlertCircle size={24} strokeWidth={1.5} className="text-error mx-auto mb-2" />
                                            <p className="text-sm text-error">{usersError}</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <p className="text-sm text-textSecondary">
                                                {userSearch ? LL.settings.noUsersFound() : LL.settings.noUsersFound()}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="group hover:bg-background transition-colors duration-200">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold text-textPrimary border border-card shadow-sm">
                                                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-textPrimary">{user.name || 'Unknown'}</div>
                                                        <div className="text-xs text-textSecondary">{user.email || 'No email'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${(user.status === 'ACTIVE' || user.status === 'active') ? 'bg-primary/10 text-primary border-primary/20' : 'bg-background text-textSecondary border-border'}`}>
                                                    {user.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {/* MFA status would need to come from API */}
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-textSecondary bg-background px-2 py-1 rounded w-fit border border-border">
                                                    <Shield size={10} strokeWidth={1.5} /> Status
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-right text-textSecondary font-mono text-xs">
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : 'Never'}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id, user.name || user.email || 'user')}
                                                    className="text-textSecondary hover:text-error transition-colors duration-200"
                                                    title="Delete user"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.5} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Backups Section - Only shown when view is 'backups' */}
            {view === 'backups' && (
                <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-in fade-in duration-300">
                    <div className="px-6 py-4 border-b border-border bg-background flex items-center gap-3">
                        <div className="p-2 bg-success/10 text-success rounded-lg">
                            <HardDrive size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-textPrimary">{LL.settings.storageRetention()}</h3>
                            <p className="text-xs text-textSecondary">{LL.settings.manageDisasterRecovery()}</p>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <div className="space-y-6">
                            <h4 className="text-sm font-bold text-textPrimary uppercase tracking-wide">{LL.settings.storageProvider()}</h4>

                            <div className="space-y-3">
                                <label
                                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${backupProvider === 's3'
                                            ? 'border-blue-200 bg-blue-50/50 ring-1 ring-blue-200'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setBackupProvider('s3')}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 ${backupProvider === 's3'
                                            ? 'border-4 border-blue-500 bg-white'
                                            : 'border-slate-300'
                                        }`}></div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-textPrimary">{LL.settings.s3CompatibleStorage()}</div>
                                        <div className="text-xs text-textSecondary">{LL.settings.s3CompatibleStorageDesc()}</div>
                                    </div>
                                    <HardDrive size={20} strokeWidth={1.5} className={backupProvider === 's3' ? 'text-primary' : 'text-textSecondary'} />
                                </label>

                                <label
                                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${backupProvider === 'backblaze'
                                            ? 'border-orange-200 bg-orange-50/50 ring-1 ring-orange-200'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setBackupProvider('backblaze')}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 ${backupProvider === 'backblaze'
                                            ? 'border-4 border-orange-500 bg-white'
                                            : 'border-slate-300'
                                        }`}></div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-textPrimary">{LL.settings.backblazeB2()}</div>
                                        <div className="text-xs text-textSecondary">Armazenamento em nuvem econômico</div>
                                    </div>
                                    <HardDrive size={20} strokeWidth={1.5} className={backupProvider === 'backblaze' ? 'text-warning' : 'text-textSecondary'} />
                                </label>

                                <label
                                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${backupProvider === 'local'
                                            ? 'border-slate-400 bg-slate-50 ring-1 ring-slate-300'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setBackupProvider('local')}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 ${backupProvider === 'local'
                                            ? 'border-4 border-slate-500 bg-white'
                                            : 'border-slate-300'
                                        }`}></div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-textPrimary">{LL.settings.localFilesystem()}</div>
                                        <div className="text-xs text-textSecondary">Não recomendado para produção</div>
                                    </div>
                                    <Server size={20} strokeWidth={1.5} className={backupProvider === 'local' ? 'text-textSecondary' : 'text-textSecondary'} />
                                </label>
                            </div>

                            {(backupProvider === 's3' || backupProvider === 'backblaze') && (
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1.5">
                                        <Input
                                            type="text"
                                            label={backupProvider === 'backblaze' ? LL.settings.applicationKeyId() : LL.settings.accessKeyId()}
                                            placeholder={backupProvider === 'backblaze' ? LL.settings.applicationKeyIdPlaceholder() : LL.settings.accessKeyIdPlaceholder()}
                                            value={backupConfig.accessKeyId}
                                            onChange={(e) => setBackupConfig({ ...backupConfig, accessKeyId: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        type="password"
                                        label={backupProvider === 'backblaze' ? LL.settings.applicationKey() : LL.settings.secretAccessKey()}
                                        placeholder={backupProvider === 'backblaze' ? LL.settings.applicationKeyPlaceholder() : LL.settings.secretAccessKeyPlaceholder()}
                                        value={backupConfig.secretAccessKey}
                                        onChange={(e) => setBackupConfig({ ...backupConfig, secretAccessKey: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            type="text"
                                            label="Bucket Name"
                                            placeholder={backupProvider === 'backblaze' ? 'my-b2-bucket' : 'my-s3-bucket'}
                                            value={backupConfig.bucketName}
                                            onChange={(e) => setBackupConfig({ ...backupConfig, bucketName: e.target.value })}
                                        />
                                        <Input
                                            type="text"
                                            label="Region"
                                            placeholder={backupProvider === 'backblaze' ? 'us-west-004' : 'us-east-1'}
                                            value={backupConfig.region}
                                            onChange={(e) => setBackupConfig({ ...backupConfig, region: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        type="text"
                                        label="Endpoint URL"
                                        placeholder={backupProvider === 'backblaze' ? 'https://s3.us-west-004.backblazeb2.com' : 'https://s3.amazonaws.com'}
                                        value={backupConfig.endpoint}
                                        onChange={(e) => setBackupConfig({ ...backupConfig, endpoint: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-sm font-bold text-textPrimary uppercase tracking-wide">Snapshot Policy</h4>
                            <div className="bg-background border border-border rounded-xl p-5 space-y-4">
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
                                {isBackupTesting ? LL.settings.testingConnection() : LL.settings.saveTestConnection()}
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
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><Cpu size={12} /> {builder.cpuLimitCores} vCPU</span>
                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded"><HardDrive size={12} /> {builder.memoryLimitMB / 1024}GB</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveBuilder(builder.id); }}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                                                >
                                                    <Trash2 size={14} />
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
                            <Button
                                onClick={() => setShowGitForm(true)}
                                variant="primary"
                                size="sm"
                            >
                                <Plus size={14} strokeWidth={1.5} /> Connect Provider
                            </Button>
                        </div>

                        {showGitForm && (
                            <div className="bg-background p-6 border-b border-border flex gap-4 animate-in slide-in-from-top-2">
                                <div className="flex-1 space-y-4">
                                    <h4 className="text-sm font-bold text-textPrimary">Add New Provider</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input type="text" placeholder="Provider Name (e.g. My Github)" />
                                        <Input type="text" placeholder="Personal Access Token" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => void handleAddGitToken()} variant="primary" size="sm">Connect Account</Button>
                                        <Button onClick={() => setShowGitForm(false)} variant="outline" size="sm">Cancel</Button>
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
