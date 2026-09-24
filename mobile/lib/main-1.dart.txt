import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() => runApp(const AppBdIa());

/// Adresse du backend en production sur Render.
const String backendUrl = 'https://bd-01n7.onrender.com';

class AppBdIa extends StatelessWidget {
  const AppBdIa({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App BD IA',
      theme: ThemeData(colorSchemeSeed: Colors.deepPurple, useMaterial3: true),
      home: const EcranScenario(),
    );
  }
}

/// Bulle de dialogue façon BD : fond blanc, bordure noire, petite pointe en bas.
class BulleDialogue extends StatelessWidget {
  final String texte;
  final bool compacte;

  const BulleDialogue({super.key, required this.texte, this.compacte = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          constraints: BoxConstraints(maxWidth: compacte ? 160 : 260),
          padding: EdgeInsets.symmetric(
              horizontal: compacte ? 8 : 14, vertical: compacte ? 6 : 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(compacte ? 12 : 18),
            border: Border.all(color: Colors.black, width: compacte ? 1.5 : 2),
            boxShadow: const [
              BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
            ],
          ),
          child: Text(
            texte,
            style: TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.w600,
              fontSize: compacte ? 10 : 14,
              height: 1.25,
            ),
          ),
        ),
        Transform.translate(
          offset: Offset(compacte ? 12 : 20, -2),
          child: Transform.rotate(
            angle: pi / 4,
            child: Container(
              width: compacte ? 10 : 16,
              height: compacte ? 10 : 16,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: Colors.black, width: compacte ? 1.5 : 2),
                  right: BorderSide(color: Colors.black, width: compacte ? 1.5 : 2),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Une case individuelle de la planche : image + bulle de dialogue superposée,
/// avec un cadre noir façon vraie case de BD.
class CasePanel extends StatelessWidget {
  final Case caseBd;

  const CasePanel({super.key, required this.caseBd});

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: const BoxDecoration(),
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (caseBd.image != null)
            Image.network(
              caseBd.image!,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return Container(
                  color: Colors.black12,
                  child: const Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                );
              },
              errorBuilder: (context, error, stack) => Container(
                color: Colors.black12,
                child: const Center(child: Icon(Icons.broken_image_outlined)),
              ),
            ),
          if (caseBd.dialogue != null)
            Positioned(
              top: 6,
              left: 6,
              right: 6,
              child: Align(
                alignment: Alignment.topLeft,
                child: BulleDialogue(texte: caseBd.dialogue!, compacte: true),
              ),
            ),
        ],
      ),
    );
  }
}

class Case {
  final String? image;
  final List<dynamic> personnages;
  final String? dialogue;

  Case({required this.image, required this.personnages, required this.dialogue});

  factory Case.fromJson(Map<String, dynamic> json) {
    return Case(
      image: json['image'],
      personnages: json['personnages'] ?? [],
      dialogue: json['dialogue'],
    );
  }
}

class EcranScenario extends StatefulWidget {
  const EcranScenario({super.key});

  @override
  State<EcranScenario> createState() => _EcranScenarioState();
}

class _EcranScenarioState extends State<EcranScenario> {
  final TextEditingController _controleur = TextEditingController();
  final PageController _pageController = PageController();
  static const int _casesParPage = 4;

  List<Case> _planche = [];
  bool _enChargement = false;
  String? _erreur;
  int _pageActuelle = 0;

  List<List<Case>> get _pages {
    final pages = <List<Case>>[];
    for (var i = 0; i < _planche.length; i += _casesParPage) {
      pages.add(_planche.sublist(
          i, i + _casesParPage > _planche.length ? _planche.length : i + _casesParPage));
    }
    return pages;
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _genererPlanche() async {
    if (_controleur.text.trim().isEmpty) return;

    setState(() {
      _enChargement = true;
      _erreur = null;
      _planche = [];
    });

    try {
      final reponse = await http.post(
        Uri.parse('$backendUrl/api/generate/planche'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'texte': _controleur.text.trim()}),
      );

      if (reponse.statusCode == 200) {
        final data = jsonDecode(reponse.body);
        final cases = (data['planche'] as List)
            .map((c) => Case.fromJson(c))
            .toList();
        setState(() {
          _planche = cases;
          _pageActuelle = 0;
        });
        if (_pageController.hasClients) {
          _pageController.jumpToPage(0);
        }
      } else {
        setState(() => _erreur = 'Erreur du serveur (${reponse.statusCode}).');
      }
    } catch (e) {
      setState(() => _erreur = 'Impossible de contacter le serveur.');
    } finally {
      setState(() => _enChargement = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('App BD IA')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _controleur,
              maxLines: 6,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Écris ton scénario ici, du début à la fin...',
              ),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _enChargement ? null : _genererPlanche,
              icon: const Icon(Icons.auto_awesome),
              label: Text(_enChargement ? 'Génération en cours...' : 'Générer la BD'),
            ),
            if (_erreur != null) ...[
              const SizedBox(height: 8),
              Text(_erreur!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            Expanded(
              child: _planche.isEmpty
                  ? const Center(child: Text('Ta BD apparaîtra ici, page par page.'))
                  : Column(
                      children: [
                        Expanded(
                          child: PageView.builder(
                            controller: _pageController,
                            itemCount: _pages.length,
                            onPageChanged: (i) => setState(() => _pageActuelle = i),
                            itemBuilder: (context, pageIndex) {
                              final casesDeLaPage = _pages[pageIndex];
                              return GridView.builder(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                gridDelegate:
                                    const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  crossAxisSpacing: 8,
                                  mainAxisSpacing: 8,
                                  childAspectRatio: 0.85,
                                ),
                                itemCount: casesDeLaPage.length,
                                itemBuilder: (context, i) =>
                                    CasePanel(caseBd: casesDeLaPage[i]),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.chevron_left),
                              onPressed: _pageActuelle > 0
                                  ? () => _pageController.previousPage(
                                      duration: const Duration(milliseconds: 250),
                                      curve: Curves.easeOut)
                                  : null,
                            ),
                            Text('Page ${_pageActuelle + 1} / ${_pages.length}'),
                            IconButton(
                              icon: const Icon(Icons.chevron_right),
                              onPressed: _pageActuelle < _pages.length - 1
                                  ? () => _pageController.nextPage(
                                      duration: const Duration(milliseconds: 250),
                                      curve: Curves.easeOut)
                                  : null,
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
