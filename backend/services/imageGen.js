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
async function genererImage(description, styleReference = '') {
  const styleQualite =
    'style bande dessinée professionnelle, encrage net, couleurs vives, très détaillé, 4k, chef-d\'œuvre';
  const promptComplet = `${styleReference} ${description}, ${styleQualite}`.trim();
  const promptEncode = encodeURIComponent(promptComplet);
  const negatifEncode = encodeURIComponent(
    'flou, basse qualité, pixelisé, déformé, watermark, texte, mains difformes'
  );
  const seed = Math.floor(Math.random() * 1000000);

  const url = `https://image.pollinations.ai/prompt/${promptEncode}?model=flux&seed=${seed}&width=1280&height=1280&nologo=true&enhance=true&negative_prompt=${negatifEncode}`;

  const aUneCle = !!process.env.POLLINATIONS_API_KEY;

  if (aUneCle) {
    // Avec une clé : requête authentifiée depuis le serveur (prioritaire, moins de
    // limite de fréquence), image renvoyée en base64 pour ne jamais exposer la clé au client.
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}` },
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    } catch (err) {
      // Si la requête authentifiée échoue pour une raison quelconque, on retombe
      // simplement sur l'URL publique anonyme plutôt que de faire échouer toute la BD.
      console.warn('Échec de la requête authentifiée Pollinations, repli sur URL anonyme.');
    }
  }

  // Sans clé (ou en repli) : URL publique directe, gratuite et sans authentification.
  return url;
}

module.exports = { genererImage };
