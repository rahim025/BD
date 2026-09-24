const axios = require('axios');

/**
 * Génère une image à partir de la description d'une case de BD.
 * Utilise Pollinations.ai.
 *
 * @param {string} description - Description visuelle de la case.
 * @param {string} styleReference - Description fixe du style/des personnages
 *   à répéter dans chaque prompt pour garder une cohérence visuelle.
 * @param {string|null} referenceImageUrl - URL de l'image d'une case précédente,
 *   utilisée comme référence visuelle pour garder les mêmes personnages.
 */
async function genererImage(description, styleReference = '', referenceImageUrl = null) {
  const styleQualite =
    'style bande dessinée professionnelle, encrage net, couleurs vives, très détaillé, 4k, chef-d\'œuvre';
  const promptComplet = `${styleReference} ${description}, ${styleQualite}`.trim();
  const promptEncode = encodeURIComponent(promptComplet);
  const negatifEncode = encodeURIComponent(
    'flou, basse qualité, pixelisé, déformé, watermark, texte, mains difformes'
  );
  const seed = Math.floor(Math.random() * 1000000);

  const aUneCle = !!process.env.POLLINATIONS_API_KEY;

  // S'il y a une image de référence ET une clé API : on utilise nanobanana,
  // qui s'appuie sur l'image fournie pour garder le même visage aux personnages.
  if (referenceImageUrl && aUneCle) {
    const imageParam = encodeURIComponent(referenceImageUrl);
    const url = `https://image.pollinations.ai/prompt/${promptEncode}?model=nanobanana&image=${imageParam}&seed=${seed}&width=1280&height=1280&nologo=true`;

    // Requête faite depuis le serveur (jamais depuis l'app) pour ne jamais exposer la clé.
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}` },
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  // Première case de la planche (pas encore de référence), ou pas de clé configurée :
  // modèle flux classique, gratuit et sans authentification, URL publique directe.
  return `https://image.pollinations.ai/prompt/${promptEncode}?model=flux&seed=${seed}&width=1280&height=1280&nologo=true&enhance=true&negative_prompt=${negatifEncode}`;
}

module.exports = { genererImage };
