// Design-sync entry: the livreur-app components exported to Claude Design as window.TousShopLivreur.
// The app has no library build, so this barrel is the "package" the converter bundles.
export { DsProvider } from './DsProvider.jsx';

export { default as AuthShell } from '../src/components/common/AuthShell.jsx';
export { default as BottomSheet } from '../src/components/common/BottomSheet.jsx';
export { default as TopBar } from '../src/components/common/TopBar.jsx';
export { default as StickyActionBar } from '../src/components/common/StickyActionBar.jsx';
export { default as EmptyState } from '../src/components/common/EmptyState.jsx';
export { default as LoadingSpinner } from '../src/components/common/LoadingSpinner.jsx';
export { default as SkeletonCard } from '../src/components/common/SkeletonCard.jsx';
export { default as StatCard } from '../src/components/common/StatCard.jsx';
export { default as FormField } from '../src/components/common/FormField.jsx';
export { default as PasswordInput } from '../src/components/common/PasswordInput.jsx';
export { default as PhoneInput } from '../src/components/common/PhoneInput.jsx';
export { default as CodeInput } from '../src/components/common/CodeInput.jsx';
export { default as FilePicker } from '../src/components/common/FilePicker.jsx';
export { default as SignaturePad } from '../src/components/common/SignaturePad.jsx';
export { default as FilterChips } from '../src/components/common/FilterChips.jsx';
export { default as SegmentedTabs } from '../src/components/common/SegmentedTabs.jsx';
export { default as CountrySelectSheet } from '../src/components/common/CountrySelectSheet.jsx';

export { default as StatusBadge, ExpeditionStatusBadge, MarketplaceStatusBadge } from '../src/components/missions/StatusBadge.jsx';
export { default as MissionCard } from '../src/components/missions/MissionCard.jsx';
export { default as MissionStepper } from '../src/components/missions/MissionStepper.jsx';
export { default as OfferCard } from '../src/components/missions/OfferCard.jsx';
export { default as OfferSheet } from '../src/components/missions/OfferSheet.jsx';
export { default as ConfirmSheet } from '../src/components/missions/ConfirmSheet.jsx';
export { default as ContactCard } from '../src/components/missions/ContactCard.jsx';
export { default as MarketplaceCard } from '../src/components/missions/MarketplaceCard.jsx';
export { default as QuickActionsRow } from '../src/components/missions/QuickActionsRow.jsx';
export { default as RouteLine } from '../src/components/missions/RouteLine.jsx';

// Workflow step lists MissionStepper takes as `steps`.
export { EXPEDITION_STEPS, MARKETPLACE_STEPS } from '../src/utils/missionFlow.js';

// The lucide icons the app itself uses (icon props take these).
export { AlertCircle, AlertTriangle, Ban, Banknote, Bell, Bike, Building2, Camera, Car, Check, CheckCheck, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleCheckBig, CircleX, Clock, Eraser, Eye, EyeOff, FileSearch, FlaskConical, Hourglass, House, ImagePlus, Info, KeyRound, Loader2, Lock, MailCheck, MailWarning, MapPin, MapPinOff, MessageSquare, Navigation, Package, PackageCheck, PackageOpen, Phone, Radio, RefreshCw, Route, Search, SearchX, ShieldCheck, ShoppingBag, Trash2, UserRound, Wallet, WifiOff, X, Zap } from 'lucide-react';
