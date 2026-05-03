import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'pink';
}

export function ActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  color = 'blue'
}: ActionButtonProps) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 border-blue-700',
    green: 'bg-green-600 hover:bg-green-700 border-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700 border-purple-700',
    orange: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
    teal: 'bg-teal-600 hover:bg-teal-700 border-teal-700',
    pink: 'bg-pink-600 hover:bg-pink-700 border-pink-700'
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-8 md:p-10 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl border-4 text-white min-h-[220px] md:min-h-[240px] text-center transform hover:scale-105 ${colorClasses[color]}`}
    >
      <Icon size={64} className="mb-4" strokeWidth={2} />
      <span className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{label}</span>
      {description && (
        <span className="text-base md:text-lg text-white/90 font-medium">
          {description}
        </span>
      )}
    </button>
  );
}