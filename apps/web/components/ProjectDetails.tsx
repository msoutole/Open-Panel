import React, { useState } from 'react';
import { Project, Service } from '../types';
import {
    ArrowLeft, Box, Database,
    HardDrive, Gauge, Globe,
    LayoutGrid, List as ListIcon, ChevronRight, Square, Plus, Cpu
} from 'lucide-react';
import { ServiceDetailView } from './ServiceDetailView';
import CreateServiceModal from './CreateServiceModal';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

// ----------------------------------------------------------------------------------
// Main Project Services List (When no service is selected)
// ----------------------------------------------------------------------------------

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
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
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
                <p className="text-slate-500 text-sm">{project.description}</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LayoutGrid size={18} />
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <ListIcon size={18} />
                </button>
            </div>
            <button
                onClick={handleAddService}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
            >
                <Plus size={16} /> Add Service
            </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localServices.map(service => (
                <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="bg-white border border-slate-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${
                            service.type === 'db' || service.type === 'redis' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                            {service.type === 'db' || service.type === 'redis' ? <Database size={24} /> : <Box size={24} />}
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            service.status === 'Running' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                            {service.status}
                        </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono bg-slate-50 px-2 py-1 rounded w-fit">{service.image}</p>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Gauge size={14} /> {service.cpu}%
                        </div>
                        <div className="flex items-center gap-1.5">
                            <HardDrive size={14} /> {service.memory}
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto">
                            {service.exposedPort ? <Globe size={14} className="text-blue-400"/> : <Square size={14} />}
                        </div>
                    </div>
                </div>
            ))}
            <button
                onClick={handleAddService}
                className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-blue-50/30 transition-all min-h-[180px] group"
            >
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                    <Plus size={24} />
                </div>
                <span className="font-medium text-sm">Create New Service</span>
            </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-4">Service Name</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Image / Type</th>
                        <th className="px-6 py-4">Resources</th>
                        <th className="px-6 py-4">Networking</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {localServices.map(service => (
                         <tr key={service.id} onClick={() => setSelectedService(service)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                        service.type === 'db' || service.type === 'redis' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {service.type === 'db' || service.type === 'redis' ? <Database size={16} /> : <Box size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 group-hover:text-primary transition-colors">{service.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{service.type}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                    service.status === 'Running' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${service.status === 'Running' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                    {service.status}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit max-w-[180px] truncate" title={service.image}>
                                    {service.image}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <Cpu size={12} className="text-slate-400"/> {service.cpu}%
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HardDrive size={12} className="text-slate-400"/> {service.memory}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-xs text-slate-500">
                                    {service.exposedPort ? (
                                        <div className="flex items-center gap-1 text-slate-700 font-mono"><Globe size={12}/> :{service.exposedPort}</div>
                                    ) : service.port ? (
                                        <div className="flex items-center gap-1 text-slate-400 font-mono"><Square size={12}/> :{service.port}</div>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-primary ml-auto" />
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
