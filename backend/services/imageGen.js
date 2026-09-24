/**
 * Génère une image à partir de la description d'une case de BD.
 * Utilise Pollinations.ai, gratuit et sans clé API.
 *
 * @param {string} description - Description visuelle de la case.
 * @param {string} styleReference - Description fixe du style/des personnages
 *   à répéter dans chaque prompt pour garder une cohérence visuelle.
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

  // model=flux : modèle par défaut de Pollinations, le plus net.
  // enhance=true : Pollinations améliore automatiquement le prompt.
  // negative_prompt : évite le flou et les artefacts.
  // 1280x1280 : bon compromis qualité/temps de génération sur le tier gratuit.
  return `https://image.pollinations.ai/prompt/${promptEncode}?model=flux&seed=${seed}&width=1280&height=1280&nologo=true&enhance=true&negative_prompt=${negatifEncode}`;
}

module.exports = { genererImage };
