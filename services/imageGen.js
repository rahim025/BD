const axios = require('axios');

/**
 * Génère une image à partir de la description d'une case de BD.
 * À adapter selon le fournisseur choisi (Stable Diffusion, DALL-E, Leonardo...).
 *
 * @param {string} description - Description visuelle de la case.
 * @param {string} styleReference - Description fixe du style/des personnages
 *   à répéter dans chaque prompt pour garder une cohérence visuelle.
 * @returns {Promise<string>} URL ou base64 de l'image générée.
 */
async function genererImage(description, styleReference = '') {
  const promptComplet = `${styleReference}\n${description}`.trim();

  const response = await axios.post(
    process.env.IMAGE_GEN_API_URL,
    {
      prompt: promptComplet,
      // Paramètres à adapter selon l'API choisie (taille, format, seed, etc.)
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.IMAGE_GEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // À adapter selon la forme de la réponse du fournisseur choisi
  return response.data.imageUrl || response.data.data?.[0]?.url;
}

module.exports = { genererImage };
