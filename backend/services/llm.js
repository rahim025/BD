const axios = require('axios');

/**
 * Découpe un scénario texte libre en une liste structurée de cases de BD.
 * Chaque case contient : une description visuelle, les personnages présents,
 * et le dialogue à afficher dans les bulles.
 *
 * @param {string} scenario - Le texte du scénario écrit par l'utilisateur.
 * @returns {Promise<Array>} Liste de cases { description, personnages, dialogue }
 */
async function decouperScenario(scenario) {
  const prompt = `
Tu es un scénariste de bande dessinée. Découpe le scénario suivant en cases de BD.
Réponds UNIQUEMENT en JSON, sous la forme d'un tableau d'objets avec les clés :
"description" (description visuelle de la scène pour un générateur d'image),
"personnages" (liste des noms des personnages présents),
"dialogue" (texte des bulles, ou null s'il n'y en a pas).

Scénario :
"""
${scenario}
"""
`.trim();

  const response = await axios.post(
    process.env.LLM_API_URL,
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LLM_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    }
  );

  const texte = response.data.content
    .filter((bloc) => bloc.type === 'text')
    .map((bloc) => bloc.text)
    .join('\n')
    .replace(/```json|```/g, '')
    .trim();

  return JSON.parse(texte);
}

module.exports = { decouperScenario };
