import React, { useState, useEffect } from 'react';
import { Settings, DEFAULT_SETTINGS } from '../types';
import { X, Save, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Settings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings({
        ...DEFAULT_SETTINGS,
        apiKey: localSettings.apiKey // Keep the API key so user doesn't lose it accidentally
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              API URL <span className="text-xs text-gray-500">(OpenAI Compatible)</span>
            </label>
            <input
              type="text"
              value={localSettings.apiUrl}
              onChange={(e) => handleChange('apiUrl', e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
              placeholder="https://openrouter.ai/api/v1/chat/completions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Model ID
            </label>
            <input
              type="text"
              value={localSettings.modelId}
              onChange={(e) => handleChange('modelId', e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
              placeholder="deepseek/deepseek-r1:free"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-800 border-t border-gray-700">
           <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Reset Defaults
          </button>

          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save size={16} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
