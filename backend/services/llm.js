const axios = require('axios');

function construirePrompt(scenario) {
  return `
Tu es un scénariste de bande dessinée professionnel. Découpe le scénario suivant en cases de BD,
pour raconter l'histoire du tout début à la toute fin, sans rien résumer ni sauter d'étape importante.
Découpe-le en autant de cases que nécessaire pour bien raconter l'histoire (généralement entre 8 et 20
cases selon la longueur du scénario) : une case par action ou changement de moment clé, pas une case par phrase.
Varie les plans (plan large, plan rapproché, gros plan) pour rendre la lecture dynamique.

Réponds UNIQUEMENT en JSON, sous la forme d'un tableau d'objets avec les clés :
"description" (description visuelle précise de la scène : personnages, action, décor, cadrage,
pour un générateur d'image — reste cohérent sur l'apparence de chaque personnage d'une case à l'autre),
"personnages" (liste des noms des personnages présents dans cette case),
"dialogue" (texte court de la bulle, une phrase courte maximum, ou null s'il n'y en a pas).

Scénario :
"""
${scenario}
"""
`.trim();
}

function nettoyerEtParser(texte) {
  const propre = texte.replace(/```json|```/g, '').trim();
  return JSON.parse(propre);
}

// Fournisseur 1 : Google Gemini (gratuit)
async function viaGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: prompt }] }],
  });
  return nettoyerEtParser(response.data.candidates[0].content.parts[0].text);
}

// Fournisseur 2 : Groq (gratuit, secours si Gemini échoue)
async function viaGroq(prompt) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return nettoyerEtParser(response.data.choices[0].message.content);
}

/**
 * Découpe un scénario en cases de BD. Essaie chaque fournisseur dans l'ordre ;
 * passe au suivant si le précédent échoue (clé absente, quota dépassé, panne...).
 */
async function decouperScenario(scenario) {
  const prompt = construirePrompt(scenario);
  const fournisseurs = [
    { nom: 'Gemini', actif: !!process.env.GEMINI_API_KEY, appel: viaGemini },
    { nom: 'Groq', actif: !!process.env.GROQ_API_KEY, appel: viaGroq },
  ];

  let derniereErreur;
  for (const fournisseur of fournisseurs) {
    if (!fournisseur.actif) continue;
    try {
      return await fournisseur.appel(prompt);
    } catch (err) {
      console.warn(`Échec avec ${fournisseur.nom}, tentative du suivant...`);
      derniereErreur = err;
    }
  }
  throw derniereErreur || new Error('Aucune clé LLM configurée (GEMINI_API_KEY ou GROQ_API_KEY).');
}

module.exports = { decouperScenario };
