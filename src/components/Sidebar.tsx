import { FileText, BookOpen, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { SidebarTab } from '../types';

const tabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
  { id: 'reader', icon: <FileText size={20} />, label: 'PDF閲覧' },
  { id: 'history', icon: <BookOpen size={20} />, label: '論文履歴' },
  { id: 'settings', icon: <Settings size={20} />, label: '設定' },
];

export function Sidebar() {
  const { sidebarTab, setSidebarTab } = useApp();

  return (
    <div className="flex flex-col items-center py-3 gap-1 bg-[#1e2330] w-14 flex-shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setSidebarTab(sidebarTab === tab.id ? 'reader' : tab.id)}
          title={tab.label}
          className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            sidebarTab === tab.id
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-gray-500 hover:bg-white/10 hover:text-gray-300'
          }`}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  );
}
