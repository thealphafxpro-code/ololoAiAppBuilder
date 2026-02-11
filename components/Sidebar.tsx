import React from 'react';
import { Project } from '../types';
import { Settings, Plus, Layout, Trash2 } from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  isMobileMenuOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onOpenSettings,
  isMobileMenuOpen
}) => {
  return (
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Top: New Project */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Middle: Project List */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            <Layout size={32} className="mx-auto mb-2 opacity-50" />
            <p>No projects yet.</p>
            <p className="text-xs mt-1">Create one to get started!</p>
          </div>
        ) : (
          <ul className="space-y-1 px-2">
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm text-left transition-colors group
                    ${currentProjectId === project.id 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}
                  `}
                >
                  <span className="truncate max-w-[160px]">{project.name}</span>
                  <div 
                    onClick={(e) => onDeleteProject(project.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom: Settings */}
      <div className="p-4 border-t border-gray-800 bg-gray-950">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-2 py-2 rounded-lg hover:bg-gray-900"
        >
          <Settings size={20} />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};
