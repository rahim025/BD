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

  const BulleDialogue({super.key, required this.texte});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          constraints: const BoxConstraints(maxWidth: 260),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.black, width: 2),
            boxShadow: const [
              BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
            ],
          ),
          child: Text(
            texte,
            style: const TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.w600,
              fontSize: 14,
              height: 1.3,
            ),
          ),
        ),
        Transform.translate(
          offset: const Offset(20, -2),
          child: Transform.rotate(
            angle: pi / 4,
            child: Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: Colors.black, width: 2),
                  right: BorderSide(color: Colors.black, width: 2),
                ),
              ),
            ),
          ),
        ),
      ],
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
  List<Case> _planche = [];
  bool _enChargement = false;
  String? _erreur;

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
        setState(() => _planche = cases);
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
                  ? const Center(child: Text('Ta planche apparaîtra ici.'))
                  : ListView.builder(
                      itemCount: _planche.length,
                      itemBuilder: (context, index) {
                        final c = _planche[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          clipBehavior: Clip.antiAlias,
                          child: Stack(
                            children: [
                              if (c.image != null)
                                Image.network(
                                  c.image!,
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                  loadingBuilder: (context, child, progress) {
                                    if (progress == null) return child;
                                    return AspectRatio(
                                      aspectRatio: 1,
                                      child: Container(
                                        color: Colors.black12,
                                        child: const Center(
                                            child: CircularProgressIndicator()),
                                      ),
                                    );
                                  },
                                ),
                              if (c.dialogue != null)
                                Positioned(
                                  top: 12,
                                  left: 12,
                                  right: 12,
                                  child: Align(
                                    alignment: Alignment.topLeft,
                                    child: BulleDialogue(texte: c.dialogue!),
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
