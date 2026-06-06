import { FileText, BookOpen, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { SidebarTab } from '../types';

const mainTabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
  { id: 'reader', icon: <FileText size={18} />, label: 'PDF閲覧' },
  { id: 'history', icon: <BookOpen size={18} />, label: '論文履歴' },
];

export function Sidebar() {
  const { sidebarTab, setSidebarTab } = useApp();

  const handleClick = (id: SidebarTab) => {
    setSidebarTab(sidebarTab === id ? 'reader' : id);
  };

  return (
    <div className="flex flex-col items-center py-4 bg-[#0d0f14] w-14 flex-shrink-0 border-r border-white/5">
      {/* ロゴ */}
      <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
        <FileText size={14} className="text-white" />
      </div>

      {/* メインナビ */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {mainTabs.map(tab => (
          <SidebarBtn
            key={tab.id}
            active={sidebarTab === tab.id}
            label={tab.label}
            onClick={() => handleClick(tab.id)}
          >
            {tab.icon}
          </SidebarBtn>
        ))}
      </nav>

      {/* 設定（下部固定） */}
      <SidebarBtn
        active={sidebarTab === 'settings'}
        label="設定"
        onClick={() => handleClick('settings')}
      >
        <Settings size={18} />
      </SidebarBtn>
    </div>
  );
}

function SidebarBtn({
  children,
  active,
  label,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative group flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${
        active
          ? 'bg-indigo-500/20 text-indigo-400 shadow-inner'
          : 'text-zinc-500 hover:bg-white/8 hover:text-zinc-300'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-r-full" />
      )}
      {children}

      {/* ツールチップ */}
      <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 rounded-md bg-zinc-800 text-zinc-200 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
        {label}
      </span>
    </button>
  );
}
