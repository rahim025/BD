const express = require('express');
const router = express.Router();
const { decouperScenario } = require('../services/llm');
const { genererImage } = require('../services/imageGen');

// POST /api/generate/planche
// Body attendu : { "texte": "...", "styleReference": "..." (optionnel) }
// Retourne la liste des cases avec leur image générée et leur dialogue.
router.post('/planche', async (req, res) => {
  try {
    const { texte, styleReference } = req.body;
    if (!texte || typeof texte !== 'string') {
      return res.status(400).json({ erreur: 'Le champ "texte" est requis.' });
    }

    const cases = await decouperScenario(texte);

    // Génération séquentielle (pas en parallèle) : la première case sert de référence
    // visuelle pour garder les mêmes personnages sur toutes les cases suivantes.
    const planche = [];
    let referenceImageUrl = null;

    for (const c of cases) {
      const image = await genererImage(c.description, styleReference, referenceImageUrl);

      // On ne garde comme référence que les vraies URL publiques (première case),
      // pas les images encodées en base64 renvoyées pour les cases suivantes.
      if (!referenceImageUrl && typeof image === 'string' && image.startsWith('http')) {
        referenceImageUrl = image;
      }

      planche.push({
        image,
        personnages: c.personnages,
        dialogue: c.dialogue,
      });
    }

    res.json({ planche });
  } catch (err) {
    console.error(err);
    // détail renvoyé pour faciliter le diagnostic pendant le développement
    const detail = err.response?.data?.error?.message || err.response?.data || err.message;
    res.status(500).json({ erreur: 'Erreur lors de la génération de la planche.', detail });
  }
});

module.exports = router;
