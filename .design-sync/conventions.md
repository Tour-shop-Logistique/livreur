# TourShop Livreur — conventions

Mobile-first courier app (pickups, deliveries, offers), French UI copy, amounts in FCFA. Design one-handed phone screens (`max-w-md` column): primary action at the bottom, large touch targets.

## Setup — always wrap in `DsProvider`

```jsx
const { DsProvider, TopBar, StickyActionBar } = window.TousShopLivreur;

<DsProvider>
  <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface-50">
    <TopBar title="Enlèvement express" subtitle="EXP-2410-0381" back />
    <main className="page-container flex-1 space-y-3 py-4">…</main>
    <StickyActionBar><button className="btn-accent btn-lg flex-1">J'ai récupéré le colis</button></StickyActionBar>
  </div>
</DsProvider>
```

`DsProvider` supplies the router (`TopBar`, `AuthShell`, `StatCard` with `to`, `MissionCard`, `MarketplaceCard` crash without it) and the `#modal-root` node that `BottomSheet`, `ConfirmSheet`, `OfferSheet` and `CountrySelectSheet` portal into.

## Color roles — keep them

- **primary** (blue) = navigation, information, secondary emphasis: `btn-primary`, `bg-primary-50 text-primary-600`.
- **accent** (orange) = field actions only (start, pick up, deliver, propose a price): `btn-accent`, `bg-accent-50 text-accent-600`.
- **success / warning / danger** = mission status: `bg-success-50 text-success-700`, `bg-warning-50`, `bg-danger-50 text-danger-600`.
- Neutrals: `surface-50…900` (`bg-surface-50` page, `text-surface-900` ink, `text-surface-500` muted).

## Styling vocabulary (compiled Tailwind — only classes the app uses exist)

| Purpose | Classes |
|---|---|
| Buttons | `btn-primary`, `btn-secondary`, `btn-accent`, `btn-danger`, `btn-ghost`; sizes `btn-sm`, `btn-lg` |
| Surfaces | `card` (white rounded panel, `shadow-card`; `shadow-raised` on hover), `divider` (top rule), `brand-gradient` |
| Bits | `icon-tile` (+ size/color, e.g. `icon-tile h-10 w-10 bg-primary-50 text-primary-600`), `badge`, `status-dot`, `skeleton` |
| Forms | `label`, `input-field`, `input-error`, `field-error`; wrap controls in `FormField` |
| Text | `section-title` (uppercase group heading), `tabular` (numbers), `font-heading` (Poppins); body is Inter |
| Layout | `page-container`, `no-scrollbar` |

Icons: lucide components on the same global (`Package`, `PackageOpen`, `MapPin`, `Navigation`, `Phone`, `Wallet`, `Zap`, `Route`, `CheckCircle2`, …) — pass to `icon` props or render `<Phone size={18} />`. `MissionStepper` takes `EXPEDITION_STEPS.enlevement` / `.livraison` or `MARKETPLACE_STEPS` from the global.

## Where the truth lives

`styles.css` → `_ds_bundle.css` for every class and theme value; `components/<group>/<Name>/<Name>.d.ts` for props (MissionCard/MarketplaceCard document the API object shape) and `<Name>.prompt.md` for examples.

## Example

```jsx
const { DsProvider, TopBar, SegmentedTabs, OfferCard, StatusBadge } = window.TousShopLivreur;

<DsProvider>
  <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface-50">
    <TopBar title="Demandes ouvertes" />
    <main className="page-container space-y-3 py-4">
      <SegmentedTabs value="express" onChange={setTab} tabs={[{ key: 'express', label: 'Express', count: 4 }, { key: 'marketplace', label: 'Marketplace' }]} />
      <p className="section-title">Près de vous</p>
      <OfferCard
        kind="express"
        title="Course express"
        subtitle="Publiée il y a 5 min"
        route={{ from: { label: 'Enlèvement', title: 'Riviera 2, Cocody' }, to: { label: 'Livraison', title: 'Zone 4, Marcory' } }}
        onOffer={openSheet}
      />
      <div className="card flex items-center justify-between p-4">
        <p className="text-sm font-semibold text-surface-900">Disponibilité</p>
        <StatusBadge tone="success" label="En ligne" />
      </div>
    </main>
  </div>
</DsProvider>
```
