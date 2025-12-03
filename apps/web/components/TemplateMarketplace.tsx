import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { 
  Search, 
  Code, 
  Database, 
  Globe, 
  Package, 
  Cpu, 
  MemoryStick,
  Rocket,
  X,
  Filter,
  Star,
  TrendingUp
} from 'lucide-react';
import { listTemplates, ApplicationTemplate } from '../services/templates';
import { TemplateDeployModal } from './TemplateDeployModal';

interface TemplateMarketplaceProps {
  onClose?: () => void;
  onProjectCreated?: (project: Project) => void;
}

type CategoryTab = 'all' | 'framework' | 'cms' | 'database' | 'static';

const categoryConfig: Record<CategoryTab, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'Todos', icon: <Package size={18} />, color: 'bg-gray-100 text-gray-700' },
  framework: { label: 'Frameworks', icon: <Code size={18} />, color: 'bg-blue-100 text-blue-700' },
  cms: { label: 'CMS', icon: <Globe size={18} />, color: 'bg-green-100 text-green-700' },
  database: { label: 'Databases', icon: <Database size={18} />, color: 'bg-purple-100 text-purple-700' },
  static: { label: 'Static Sites', icon: <Package size={18} />, color: 'bg-orange-100 text-orange-700' },
};

const languageColors: Record<string, string> = {
  nodejs: 'bg-green-500',
  python: 'bg-blue-500',
  php: 'bg-indigo-500',
  ruby: 'bg-red-500',
  go: 'bg-cyan-500',
  java: 'bg-orange-500',
  javascript: 'bg-yellow-500',
  typescript: 'bg-blue-600',
};

export const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({
  onClose,
  onProjectCreated,
}) => {
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ApplicationTemplate | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listTemplates();
      setTemplates(result.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    // Filter by category
    if (activeTab !== 'all' && template.category !== activeTab) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.language.toLowerCase().includes(query) ||
        template.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleSelectTemplate = (template: ApplicationTemplate) => {
    setSelectedTemplate(template);
    setShowDeployModal(true);
  };

  const handleDeploySuccess = (result: { project: Project }) => {
    setShowDeployModal(false);
    setSelectedTemplate(null);
    if (onProjectCreated) {
      onProjectCreated(result.project);
    }
    if (onClose) {
      onClose();
    }
  };

  // Get popular templates (first 6)
  const popularTemplates = templates.slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Rocket className="text-blue-600" size={24} />
                <h1 className="text-xl font-bold text-gray-900">Template Marketplace</h1>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {templates.length} templates
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 mt-4">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as CategoryTab)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeTab === key
                    ? config.color
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {config.icon}
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 font-medium">Erro ao carregar templates</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={loadTemplates}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Popular Templates (only show when no search/filter) */}
              {activeTab === 'all' && !searchQuery && popularTemplates.length > 0 && (
                <section className="mb-8">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                    <TrendingUp size={20} className="text-orange-500" />
                    Templates Populares
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {popularTemplates.map((template) => (
                      <PopularTemplateCard
                        key={template.id}
                        template={template}
                        onSelect={() => handleSelectTemplate(template)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* All Templates */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {activeTab === 'all' ? 'Todos os Templates' : categoryConfig[activeTab].label}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({filteredTemplates.length})
                  </span>
                </h2>

                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Nenhum template encontrado</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-blue-600 hover:underline"
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={() => handleSelectTemplate(template)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Deploy Modal */}
      {showDeployModal && selectedTemplate && (
        <TemplateDeployModal
          template={selectedTemplate}
          onClose={() => {
            setShowDeployModal(false);
            setSelectedTemplate(null);
          }}
          onSuccess={handleDeploySuccess}
        />
      )}
    </div>
  );
};

// Popular Template Card (Featured)
interface TemplateCardProps {
  template: ApplicationTemplate;
  onSelect: () => void;
}

const PopularTemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{template.icon || '📦'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {template.name}
            </h3>
            <Star size={14} className="text-yellow-500 fill-current" />
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
          
          <div className="flex items-center gap-3 mt-3">
            <span className={`w-2 h-2 rounded-full ${languageColors[template.language] || 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">{template.language}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {template.buildpack}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Regular Template Card
const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{template.icon || '📦'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {template.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${languageColors[template.language] || 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">{template.language}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{template.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
          {template.buildpack}
        </span>
        
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {template.minCpu && (
            <span className="flex items-center gap-1">
              <Cpu size={12} />
              {template.minCpu}
            </span>
          )}
          {template.minMemory && (
            <span className="flex items-center gap-1">
              <MemoryStick size={12} />
              {template.minMemory}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateMarketplace;
