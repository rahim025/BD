# App BD IA

Application mobile qui transforme un scénario écrit en bande dessinée générée par IA.

## Fonctionnement

1. L'utilisateur écrit son scénario dans l'app (texte libre, du début à la fin).
2. Le backend envoie ce texte à un LLM qui le découpe en une liste de cases structurées
   (description visuelle, personnages présents, dialogue).
3. Chaque case est envoyée à un service de génération d'image pour produire le dessin.
4. Le backend compose la planche finale (cases + bulles de dialogue) et la renvoie à l'app.

## Structure du repo

```
app-bd-ia/
├── backend/          API Node.js/Express
│   ├── routes/
│   │   ├── scenario.js   -> découpe le scénario en cases via LLM
│   │   └── generate.js   -> génère les images + compose la planche
│   ├── services/
│   │   ├── llm.js        -> appel à l'API LLM (Claude/GPT)
│   │   └── imageGen.js   -> appel à l'API de génération d'image
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── mobile/           App Flutter
    ├── lib/main.dart
    └── pubspec.yaml
```

## Démarrage rapide — backend

```bash
cd backend
npm install
cp .env.example .env   # renseigner tes clés API
npm run dev
```

## Démarrage rapide — mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Prochaines étapes

- [ ] Brancher une vraie clé API LLM dans `services/llm.js`
- [ ] Brancher une vraie clé API de génération d'image dans `services/imageGen.js`
- [ ] Gérer la cohérence visuelle des personnages d'une case à l'autre (référence de personnage fixe dans le prompt)
- [ ] Composition des bulles de dialogue sur les images (Canvas/Sharp côté backend)
- [ ] Écran de galerie des BD générées dans l'app
