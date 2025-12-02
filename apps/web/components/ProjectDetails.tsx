import React, { useState } from 'react';
import { Project, Service } from '../types';
import {
    ArrowLeft, Box, Database,
    HardDrive, Gauge, Globe,
    LayoutGrid, List as ListIcon, ChevronRight, Square, Plus, Cpu
} from 'lucide-react';
import { ServiceDetailView } from './ServiceDetailView';
import CreateServiceModal from './CreateServiceModal';
import { useTranslations } from '../src/i18n/i18n-react';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

// ----------------------------------------------------------------------------------
// Main Project Services List (When no service is selected)
// ----------------------------------------------------------------------------------

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
  const LL = useTranslations();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localServices, setLocalServices] = useState<Service[]>(project.services);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);

  const handleAddService = () => {
      setIsCreateServiceModalOpen(true);
  };

  const handleServiceCreated = (newService: Service) => {
      setLocalServices([...localServices, newService]);
  };

  if (selectedService) {
      return (
          <ServiceDetailView
            service={selectedService}
            project={project}
            onBack={() => setSelectedService(null)}
            onSelectService={setSelectedService}
          />
      );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={onBack} className="p-2 hover:bg-background rounded-lg text-textSecondary transition-colors duration-200">
                <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-textPrimary">{project.name}</h2>
                <p className="text-textSecondary text-xs sm:text-sm">{project.description}</p>
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'grid' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                >
                    <LayoutGrid size={18} strokeWidth={1.5} />
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'list' ? 'bg-background text-textPrimary shadow-sm' : 'text-textSecondary hover:text-textPrimary'}`}
                >
                    <ListIcon size={18} strokeWidth={1.5} />
                </button>
            </div>
            <button
                onClick={handleAddService}
                className="flex items-center gap-2 bg-primary hover:bg-primaryHover active:bg-primaryActive text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
            >
                <Plus size={16} strokeWidth={1.5} /> {LL.projectDetails.addService()}
            </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {localServices.map(service => (
                <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-border ${
                            service.type === 'db' || service.type === 'redis' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                        }`}>
                            {service.type === 'db' || service.type === 'redis' ? <Database size={24} strokeWidth={1.5} /> : <Box size={24} strokeWidth={1.5} />}
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            service.status === 'Running' ? 'bg-success/10 text-success border-success/20' : 'bg-background text-textSecondary border-border'
                        }`}>
                            {service.status}
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-textPrimary group-hover:text-primary transition-colors duration-200">{service.name}</h3>
                    <p className="text-xs text-textSecondary mt-1 font-mono bg-background px-2 py-1 rounded w-fit">{service.image}</p>

                    <div className="mt-6 pt-4 border-t border-border flex items-center gap-4 text-xs text-textSecondary font-medium">
                        <div className="flex items-center gap-1.5">
                            <Gauge size={14} strokeWidth={1.5} /> {service.cpu}%
                        </div>
                        <div className="flex items-center gap-1.5">
                            <HardDrive size={14} strokeWidth={1.5} /> {service.memory}
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                            {service.exposedPort ? <Globe size={14} strokeWidth={1.5} className="text-primary"/> : <Square size={14} strokeWidth={1.5} />}
                        </div>
                    </div>
                </div>
            ))}
            <button
                onClick={handleAddService}
                className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-textSecondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 min-h-[180px] group"
            >
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors duration-200">
                    <Plus size={24} strokeWidth={1.5} />
                </div>
                <span className="font-medium text-sm">{LL.projectDetails.createNewService()}</span>
            </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-background border-b border-border text-xs uppercase text-textSecondary font-medium">
                    <tr>
                        <th className="px-6 py-4">{LL.projectDetails.serviceName()}</th>
                        <th className="px-6 py-4">{LL.projectDetails.status()}</th>
                        <th className="px-6 py-4">{LL.projectDetails.imageType()}</th>
                        <th className="px-6 py-4">{LL.projectDetails.resources()}</th>
                        <th className="px-6 py-4">{LL.projectDetails.networking()}</th>
                        <th className="px-6 py-4 text-right">{LL.projectDetails.actions()}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {localServices.map(service => (
                         <tr key={service.id} onClick={() => setSelectedService(service)} className="hover:bg-background cursor-pointer transition-colors duration-200 group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                        service.type === 'db' || service.type === 'redis' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                                    }`}>
                                        {service.type === 'db' || service.type === 'redis' ? <Database size={16} strokeWidth={1.5} /> : <Box size={16} strokeWidth={1.5} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-textPrimary group-hover:text-primary transition-colors duration-200">{service.name}</div>
                                        <div className="text-[10px] text-textSecondary uppercase font-bold">{service.type}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                    service.status === 'Running' ? 'bg-success/10 text-success border-success/20' : 'bg-background text-textSecondary border-border'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'Running' ? 'bg-success' : 'bg-textSecondary'}`}></div>
                                    {service.status}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-mono text-xs text-textSecondary bg-background px-2 py-1 rounded w-fit max-w-[180px] truncate" title={service.image}>
                                    {service.image}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-xs text-textSecondary">
                                    <div className="flex items-center gap-2">
                                        <Cpu size={12} strokeWidth={1.5} className="text-textSecondary"/> {service.cpu}%
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HardDrive size={12} strokeWidth={1.5} className="text-textSecondary"/> {service.memory}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-xs text-textSecondary">
                                    {service.exposedPort ? (
                                        <div className="flex items-center gap-1 text-textPrimary font-mono"><Globe size={12} strokeWidth={1.5}/> :{service.exposedPort}</div>
                                    ) : service.port ? (
                                        <div className="flex items-center gap-1 text-textSecondary font-mono"><Square size={12} strokeWidth={1.5}/> :{service.port}</div>
                                    ) : (
                                        <span className="text-textSecondary">-</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight size={18} strokeWidth={1.5} className="text-textSecondary group-hover:text-primary ml-auto transition-colors duration-200" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      <CreateServiceModal
        isOpen={isCreateServiceModalOpen}
        onClose={() => setIsCreateServiceModalOpen(false)}
        projectId={project.id}
        onServiceCreated={handleServiceCreated}
        existingServiceNames={localServices.map(s => s.name)}
      />
    </div>
  );
};
