import React, { useState, useEffect } from 'react';

interface Resource {
  _id: string;
  name: string;
  type: string;
  content: string;
  created_at: string;
}

export const AIResourcesView: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine API URL based on environment (assuming proxy in dev, direct in prod or configured)
  // In this setup, we are calling the AI service directly or via a proxy.
  // Ideally, this should go through the main API or Traefik routing.
  // Since we set up Traefik, we can reach it at http://ai.openpanel.local/resources if DNS is set,
  // or localhost:8000/resources if locally exposing ports.
  // For the frontend running in browser, 'ai.openpanel.local' needs to resolve.
  // If not using local DNS, we might need a proxy in Vite.
  // For now, let's try relative path assuming proxy setup or direct localhost:8000 for dev.
  const API_URL = import.meta.env.DEV ? 'http://localhost:8000' : '/ai-api'; 

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(`${API_URL}/resources`);
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }
        const data = await response.json();
        setResources(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) return <div className="p-8 text-text-primary">Loading AI Resources...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 bg-background min-h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">AI Knowledge Base</h2>
        <p className="text-text-secondary">Resources managed by AI Agents via MCP.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.length === 0 ? (
          <div className="col-span-full text-center p-10 border-2 border-dashed border-border rounded-lg">
            <p className="text-text-secondary">No resources found. Ask your AI Agent to create one!</p>
          </div>
        ) : (
          resources.map((resource) => (
            <div key={resource._id} className="bg-surface p-6 rounded-lg shadow-sm border border-border hover:border-primary transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-text-primary">{resource.name}</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                  {resource.type}
                </span>
              </div>
              <div className="bg-background p-3 rounded border border-border mb-4 h-32 overflow-y-auto font-mono text-sm text-text-secondary">
                {resource.content}
              </div>
              <div className="text-xs text-text-secondary">
                ID: {resource._id}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
