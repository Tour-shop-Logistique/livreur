import { useSelector } from 'react-redux';
import { FlaskConical } from 'lucide-react';

export default function DevBypassBanner() {
  const isDevBypass = useSelector((state) => state.auth.isDevBypass);
  if (!isDevBypass) return null;

  return (
    <div className="safe-top flex items-center justify-center gap-1.5 bg-warning-100 px-3 py-1.5 text-xs font-semibold text-warning-800">
      <FlaskConical size={13} /> Session de démonstration — données non réelles
    </div>
  );
}
