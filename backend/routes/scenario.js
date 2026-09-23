const express = require('express');
const router = express.Router();
const { decouperScenario } = require('../services/llm');

// POST /api/scenario/decouper
// Body attendu : { "texte": "..." }
router.post('/decouper', async (req, res) => {
  try {
    const { texte } = req.body;
    if (!texte || typeof texte !== 'string') {
      return res.status(400).json({ erreur: 'Le champ "texte" est requis.' });
    }

    const cases = await decouperScenario(texte);
    res.json({ cases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erreur: 'Erreur lors du découpage du scénario.' });
  }
});

module.exports = router;
