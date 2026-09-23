/**
 * Génère une image à partir de la description d'une case de BD.
 * Utilise Pollinations.ai, gratuit et sans clé API.
 *
 * @param {string} description - Description visuelle de la case.
 * @param {string} styleReference - Description fixe du style/des personnages
 *   à répéter dans chaque prompt pour garder une cohérence visuelle.
 */
async function genererImage(description, styleReference = '') {
  const promptComplet = `${styleReference} ${description}`.trim();
  const promptEncode = encodeURIComponent(promptComplet);
  const seed = Math.floor(Math.random() * 1000000);

  // Pollinations génère l'image directement à cette adresse, sans clé ni étape
  // de vérification préalable : l'URL est renvoyée telle quelle à l'app mobile,
  // qui affichera l'image en la chargeant elle-même.
  return `https://image.pollinations.ai/prompt/${promptEncode}?seed=${seed}&width=768&height=768&nologo=true`;
}

module.exports = { genererImage };
