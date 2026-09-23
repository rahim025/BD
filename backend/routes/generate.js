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

    const planche = await Promise.all(
      cases.map(async (c) => {
        const image = await genererImage(c.description, styleReference);
        return {
          image,
          personnages: c.personnages,
          dialogue: c.dialogue,
        };
      })
    );

    res.json({ planche });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur lors de la génération de la planche.' });
  }
});

module.exports = router;
