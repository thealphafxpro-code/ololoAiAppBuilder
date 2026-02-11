import React, { useState, useEffect, useRef } from 'react';
import { Project, Settings as SettingsType, DEFAULT_SETTINGS } from './types';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { generateCode } from './services/llmService';
import { 
  Code, 
  Eye, 
  Download, 
  Menu, 
  SendHorizontal, 
  Loader2,
  Maximize2,
  Undo2,
  Redo2,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const STORAGE_KEY = 'ai-website-builder-data';

// Device width configurations
const DEVICES = {
  mobile: { width: '375px', label: 'Mobile' },
  tablet: { width: '768px', label: 'Tablet' },
  desktop: { width: '100%', label: 'Desktop' },
};

export default function App() {
  // --- Global State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS);
  
  // --- UI State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  // --- Interaction State ---
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Derived State
  const currentProject = projects.find(p => p.id === currentProjectId);

  // --- Persistence & Migration ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migrate legacy projects to include history structure
        if (parsed.projects) {
          const migratedProjects = parsed.projects.map((p: any) => ({
            ...p,
            history: p.history || [p.code],
            historyIndex: typeof p.historyIndex === 'number' ? p.historyIndex : 0
          }));
          setProjects(migratedProjects);
        }

        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.currentProjectId) setCurrentProjectId(parsed.currentProjectId);
      } catch (e) {
        console.error("Failed to load local storage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      projects,
      settings,
      currentProjectId
    }));
  }, [projects, settings, currentProjectId]);

  // --- Project Management ---
  const handleNewProject = () => {
    const initialCode = '<!-- Start building your website -->\n<div style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f3f4f6; color: #1f2937;">\n  <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem;">Hello World</h1>\n  <p style="color: #6b7280;">Describe what you want to build in the prompt box below.</p>\n</div>';
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: `Project ${projects.length + 1}`,
      code: initialCode,
      lastModified: Date.now(),
      history: [initialCode],
      historyIndex: 0
    };
    
    setProjects(prev => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    setIsMobileMenuOpen(false);
    setViewMode('preview');
  };

  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(id);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      setProjects(prev => prev.filter(p => p.id !== projectToDelete));
      if (currentProjectId === projectToDelete) {
        setCurrentProjectId(null);
      }
      setProjectToDelete(null);
    }
  };

  // --- History (Undo/Redo) Logic ---
  const updateProjectCode = (projectId: string, newCode: string, pushToHistory: boolean = true) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;

      let newHistory = p.history;
      let newIndex = p.historyIndex;

      if (pushToHistory) {
        // If we are in the middle of history and make a change, truncate future
        const historyUpToNow = p.history.slice(0, p.historyIndex + 1);
        newHistory = [...historyUpToNow, newCode];
        
        // Limit history size to prevent memory issues (e.g., last 50 steps)
        if (newHistory.length > 50) {
          newHistory = newHistory.slice(newHistory.length - 50);
        }
        
        newIndex = newHistory.length - 1;
      }

      return {
        ...p,
        code: newCode,
        history: newHistory,
        historyIndex: newIndex,
        lastModified: Date.now()
      };
    }));
  };

  const handleUndo = () => {
    if (!currentProject || currentProject.historyIndex <= 0) return;
    const newIndex = currentProject.historyIndex - 1;
    const previousCode = currentProject.history[newIndex];
    
    setProjects(prev => prev.map(p => 
      p.id === currentProject.id 
        ? { ...p, code: previousCode, historyIndex: newIndex } 
        : p
    ));
  };

  const handleRedo = () => {
    if (!currentProject || currentProject.historyIndex >= currentProject.history.length - 1) return;
    const newIndex = currentProject.historyIndex + 1;
    const nextCode = currentProject.history[newIndex];
    
    setProjects(prev => prev.map(p => 
      p.id === currentProject.id 
        ? { ...p, code: nextCode, historyIndex: newIndex } 
        : p
    ));
  };

  // --- Generation Logic ---
  const handleGenerate = async () => {
    if (!prompt.trim() || !currentProject) return;
    if (!settings.apiKey) {
      alert("Please set your API Key in Settings first.");
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const generatedCode = await generateCode(prompt, settings, currentProject.code);
      updateProjectCode(currentProject.id, generatedCode, true);
      setPrompt('');
      setViewMode('preview');
    } catch (error) {
      // Error is handled in the service via alerts, but we catch here to stop spinner
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentProject) return;
    
    const newCode = e.target.value;
    
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProject.id) return p;
      
      // Update the current history entry in place so we don't lose typed characters if we switch tabs
      const updatedHistory = [...p.history];
      updatedHistory[p.historyIndex] = newCode;

      return {
        ...p,
        code: newCode,
        history: updatedHistory,
        lastModified: Date.now()
      };
    }));
  };
  
  const handleDownload = () => {
    if (!currentProject) return;
    const blob = new Blob([currentProject.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full bg-gray-950 text-white overflow-hidden font-sans selection:bg-blue-500/30">
      <Sidebar
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={(id) => { setCurrentProjectId(id); setIsMobileMenuOpen(false); }}
        onNewProject={handleNewProject}
        onDeleteProject={handleRequestDelete}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl scale-100 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-2">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Project?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Are you sure you want to delete this project? <br/>
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-4">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteProject}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-medium shadow-lg shadow-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 relative min-w-0 h-full bg-[#0d1117]">
        
        {/* --- Header --- */}
        <header className="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md flex items-center justify-between px-4 flex-shrink-0 z-20 shadow-sm">
          {/* Left: Mobile Menu & Project Title */}
          <div className="flex items-center gap-4 overflow-hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            
            {/* Window Controls (Decorative) */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors"></div>
            </div>

            {currentProject && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-gray-200 truncate max-w-[150px] sm:max-w-[200px]">
                  {currentProject.name}
                </span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <CheckCircle2 size={10} className="text-green-500" />
                  Saved
                </span>
              </div>
            )}
          </div>

          {/* Center: Toolbar (Undo/Redo & Device Toggles) */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
              <button
                onClick={handleUndo}
                disabled={!currentProject || currentProject.historyIndex === 0}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Undo"
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={handleRedo}
                disabled={!currentProject || currentProject.historyIndex >= (currentProject.history?.length || 0) - 1}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Redo"
              >
                <Redo2 size={16} />
              </button>
            </div>

            {/* Device Toggles (Only visible in Preview mode) */}
            {viewMode === 'preview' && (
              <div className="hidden sm:flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                  title="Mobile View"
                >
                  <Smartphone size={16} />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-md transition-all ${previewDevice === 'tablet' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                  title="Tablet View"
                >
                  <Tablet size={16} />
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                  title="Desktop View"
                >
                  <Monitor size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Right: View Mode & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'preview' ? 'bg-gray-700 text-white shadow-sm ring-1 ring-white/10' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Eye size={14} />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'code' ? 'bg-gray-700 text-white shadow-sm ring-1 ring-white/10' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Code size={14} />
                <span className="hidden sm:inline">Code</span>
              </button>
            </div>
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700"
              title="Download index.html"
            >
              <Download size={18} />
            </button>
          </div>
        </header>

        {/* --- Workspace --- */}
        <main className="flex-1 overflow-hidden relative bg-[#0d1117] flex items-center justify-center p-4">
          {!currentProject ? (
            <div className="flex flex-col items-center justify-center text-gray-500 max-w-md text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-gray-800/50 rounded-3xl flex items-center justify-center mb-6 border border-gray-700 shadow-xl shadow-black/20">
                <Maximize2 size={40} className="text-blue-500 opacity-80" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-200">AI Website Builder</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Start a new project to generate stunning, responsive websites instantly using AI.
              </p>
              <button 
                onClick={handleNewProject}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Start New Project
              </button>
            </div>
          ) : (
            <>
              {viewMode === 'preview' ? (
                <div 
                  className="transition-all duration-300 ease-in-out shadow-2xl bg-white overflow-hidden relative"
                  style={{
                    width: previewDevice === 'mobile' ? DEVICES.mobile.width : 
                           previewDevice === 'tablet' ? DEVICES.tablet.width : 
                           DEVICES.desktop.width,
                    height: previewDevice === 'desktop' ? '100%' : '95%',
                    borderRadius: previewDevice === 'desktop' ? '0' : '12px',
                    border: previewDevice === 'desktop' ? 'none' : '8px solid #333'
                  }}
                >
                  {/* Iframe Protection */}
                  <div className="absolute inset-0 z-0 bg-white">
                    <iframe
                      title="Preview"
                      srcDoc={currentProject.code}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-modals allow-same-origin"
                    />
                  </div>
                  
                  {/* Device Frame Details (Notch etc for mobile) */}
                  {previewDevice === 'mobile' && (
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#333] rounded-b-xl z-10 pointer-events-none"></div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <textarea
                    value={currentProject.code}
                    onChange={handleManualCodeChange}
                    spellCheck="false"
                    className="w-full h-full bg-[#1a1f29] text-gray-300 font-mono text-sm p-6 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 leading-relaxed border border-gray-800 rounded-lg shadow-inner"
                    placeholder="HTML Code..."
                  />
                  <div className="absolute top-4 right-6 bg-gray-800/80 backdrop-blur text-xs px-2 py-1 rounded text-gray-400 pointer-events-none border border-gray-700">
                    Editable
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* --- Footer (Prompt Input) --- */}
        <footer className="p-4 bg-gray-900 border-t border-gray-800 flex-shrink-0 z-20">
          <div className="relative max-w-4xl mx-auto w-full group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-focus-within:opacity-30 transition duration-500 blur ${isGenerating ? 'opacity-50 animate-pulse' : ''}`}></div>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder={currentProject ? "Ask AI to change colors, add sections, or fix bugs..." : "Create a project to start..."}
              disabled={!currentProject || isGenerating}
              className="relative w-full bg-gray-950 border border-gray-700 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 placeholder-gray-500 resize-none h-[56px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            
            <button
              onClick={handleGenerate}
              disabled={!currentProject || isGenerating || !prompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:bg-transparent disabled:text-gray-600 transition-colors z-10"
            >
              {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <SendHorizontal size={20} />}
            </button>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-600">
              AI can make mistakes. Use the Undo button to revert changes.
            </p>
          </div>
        </footer>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}