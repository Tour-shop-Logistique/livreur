import { TopBar, Bell, RefreshCw } from 'livreur-app';

const Frame = ({ children }) => <div className="max-w-md bg-surface-50 pb-4">{children}</div>;

export const Simple = () => (
  <Frame>
    <TopBar title="Mes missions" />
  </Frame>
);

export const AvecRetourEtSousTitre = () => (
  <Frame>
    <TopBar title="Enlèvement express" subtitle="EXP-2410-0381" back />
  </Frame>
);

export const AvecActions = () => (
  <Frame>
    <TopBar
      title="Demandes ouvertes"
      right={
        <>
          <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100" aria-label="Actualiser"><RefreshCw size={20} /></button>
          <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent-500" />
          </button>
        </>
      }
    />
  </Frame>
);
