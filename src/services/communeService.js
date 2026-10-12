import api from './api';

// GET /communes?code_pays= — liste publique des communes actives d'un pays,
// configurees par le backoffice (meme route que client-app / agence).
const listCommunes = async (codePays) => {
  const { data } = await api.get('/communes', { params: { code_pays: codePays } });
  return data;
};

export default { listCommunes };
