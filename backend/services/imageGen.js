const axios = require('axios');

// Fournisseur 1 : Pollinations.ai (gratuit, aucune clé nécessaire)
async function viaPollinations(promptComplet) {
  const promptEncode = encodeURIComponent(promptComplet);
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${promptEncode}?seed=${seed}&width=768&height=768&nologo=true`;

  // On vérifie que le service répond avant de renvoyer l'URL (GET partiel, pas HEAD :
  // certains serveurs comme Pollinations ne supportent pas HEAD et répondent en erreur).
  await axios.get(url, { timeout: 20000, responseType: 'arraybuffer' });
  return url;
}

// Fournisseur 2 : Hugging Face Inference Providers (gratuit, secours si Pollinations échoue)
// L'ancien domaine api-inference.huggingface.co est fermé ; le nouveau point d'entrée est router.huggingface.co.
async function viaHuggingFace(promptComplet) {
  const response = await axios.post(
    'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
    { inputs: promptComplet },
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    }
  );
  const base64 = Buffer.from(response.data, 'binary').toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Génère une image à partir de la description d'une case de BD.
 * Essaie chaque fournisseur dans l'ordre ; passe au suivant en cas d'échec.
 *
 * @param {string} description - Description visuelle de la case.
 * @param {string} styleReference - Description fixe du style/des personnages
 *   à répéter dans chaque prompt pour garder une cohérence visuelle.
 */
async function genererImage(description, styleReference = '') {
  const promptComplet = `${styleReference} ${description}`.trim();

  const fournisseurs = [
    { nom: 'Pollinations', actif: true, appel: viaPollinations },
    { nom: 'Hugging Face', actif: !!process.env.HUGGINGFACE_API_KEY, appel: viaHuggingFace },
  ];

  let derniereErreur;
  for (const fournisseur of fournisseurs) {
    if (!fournisseur.actif) continue;
    try {
      return await fournisseur.appel(promptComplet);
    } catch (err) {
      console.warn(`Échec avec ${fournisseur.nom}, tentative du suivant...`);
      derniereErreur = err;
    }
  }
  throw derniereErreur || new Error('Aucun fournisseur d\'image disponible.');
}

module.exports = { genererImage };
