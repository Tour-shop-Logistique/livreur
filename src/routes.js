export const ROUTES = {
  HOME: '/',
  MISSIONS: '/missions',
  MISSION_DETAIL: '/missions/:id',
  MARKETPLACE_DETAIL: '/marketplace/:id',
  EARNINGS: '/gains',
  ABONNEMENT: '/abonnement',
  NOTIFICATIONS: '/activite',
  PROFILE: '/profil',
  LOGIN: '/connexion',
  REGISTER: '/inscription',
  VERIFY_EMAIL: '/verification-email',
  PENDING_VALIDATION: '/validation-en-cours',
  FORGOT_PASSWORD: '/mot-de-passe-oublie',
  RESET_PASSWORD: '/reinitialiser-mot-de-passe',
};

export const missionDetailPath = (id) => `/missions/${id}`;
export const marketplaceDetailPath = (id) => `/marketplace/${id}`;
