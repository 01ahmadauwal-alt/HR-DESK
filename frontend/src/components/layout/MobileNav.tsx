import { Menu, X } from 'lucide-react';

interface MobileNavProps {
  open: boolean;
  onToggle: () => void;
}

export default function MobileNav({ open, onToggle }: MobileNavProps) {
  return (
    <button
      onClick={onToggle}
      className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg hover:bg-slate-100 transition-colors"
      aria-label="Toggle menu"
    >
      {open ? (
        <X size={24} className="text-slate-900" />
      ) : (
        <Menu size={24} className="text-slate-900" />
      )}
    </button>
  );
}
