import React, { useState, useEffect } from 'react';
import { Search, Grid, List, Filter, Package, Code, Database, Globe, Cpu, MemoryStick } from 'lucide-react';
import { listTemplates, ApplicationTemplate } from '../services/templates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: ApplicationTemplate) => void;
  selectedTemplate?: ApplicationTemplate | null;
}

type ViewMode = 'grid' | 'list';
type CategoryFilter = 'all' | 'framework' | 'cms' | 'database' | 'static' | 'language';

const categoryIcons: Record<string, React.ReactNode> = {
  framework: <Code size={16} />,
  cms: <Globe size={16} />,
  database: <Database size={16} />,
  static: <Package size={16} />,
  language: <Code size={16} />,
};

const categoryLabels: Record<string, string> = {
  all: 'Todos',
  framework: 'Frameworks',
  cms: 'CMS',
  database: 'Bancos de Dados',
  static: 'Sites Estáticos',
  language: 'Linguagens',
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  selectedTemplate,
}) => {
  const [templates, setTemplates] = useState<ApplicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

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
    if (categoryFilter !== 'all' && template.category !== categoryFilter) {
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

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, ApplicationTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Erro ao carregar templates</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={loadTemplates}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
      </p>

      {/* Templates Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onClick={() => onSelectTemplate(template)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                {categoryIcons[category]}
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-1">
                {categoryTemplates.map((template) => (
                  <TemplateListItem
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onClick={() => onSelectTemplate(template)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Template Card Component (Grid View)
interface TemplateCardProps {
  template: ApplicationTemplate;
  isSelected: boolean;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl">{template.icon || '📦'}</div>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          {template.buildpack}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>

      {/* Description */}
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{template.description}</p>

      {/* Tags */}
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Resources */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
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
  );
};

// Template List Item Component (List View)
const TemplateListItem: React.FC<TemplateCardProps> = ({ template, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        px-4 py-3 rounded-lg border cursor-pointer transition-all flex items-center gap-4
        ${isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 bg-white'
        }
      `}
    >
      {/* Icon */}
      <div className="text-xl">{template.icon || '📦'}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{template.name}</h4>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
            {template.language}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">{template.description}</p>
      </div>

      {/* Resources */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
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

      {/* Buildpack */}
      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
        {template.buildpack}
      </span>
    </div>
  );
};

export default TemplateSelector;
