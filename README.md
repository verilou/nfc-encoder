# NFC Encoder

## Description

Ce projet est un outil de programmation de cartes NFC qui permet d'encoder des URLs sur des cartes NFC. Il offre deux modes d'utilisation :

1. Un mode interactif pour encoder une carte à la fois
2. Un mode batch pour encoder plusieurs cartes à partir d'un fichier Excel

## Prérequis

- Node.js (version compatible avec les dépendances)
- Un lecteur NFC compatible PC/SC
- pnpm (gestionnaire de paquets)

## Installation

1. Cloner le repository :

```bash
git clone [URL_DU_REPO]
cd nfc-encoder
```

2. Installer les dépendances :

```bash
pnpm install
```

## Génération des Exécutables

Le projet utilise `pkg` pour générer des exécutables autonomes pour différents systèmes d'exploitation.

### Prérequis pour la génération

- Node.js
- pnpm
- Les dépendances natives doivent être compilées pour votre plateforme

### Génération des exécutables

1. Installer pkg globalement :

```bash
pnpm add -g pkg
```

2. Générer les exécutables :

```bash
pnpm pkg
```

Les exécutables seront générés dans le dossier `SEKAOP_Script/bin/` avec les noms suivants :

- Windows : `nfc-encoder-win.exe`
- macOS : `nfc-encoder-macos`
- Linux : `nfc-encoder-linux`

### Utilisation des exécutables

1. **Windows** :

```bash
.\nfc-encoder-win.exe
```

2. **macOS** :

```bash
./nfc-encoder-macos
```

3. **Linux** :

```bash
./nfc-encoder-linux
```

### Notes importantes

- Les exécutables incluent toutes les dépendances nécessaires
- Assurez-vous que les pilotes NFC sont installés sur votre système
- Sur Linux, vous devrez peut-être ajouter les permissions d'exécution :

```bash
chmod +x ./nfc-encoder-linux
```

## Utilisation

### Mode Interactif

Pour encoder une carte NFC individuellement :

```bash
node index.js
```

- Le programme attendra la détection d'une carte NFC
- Une fois la carte détectée, vous devrez saisir l'URL au format : `https://ecardnfc.fr/<code>`
- L'URL sera automatiquement encodée sur la carte

### Mode Batch (Encodage Multiple)

Pour encoder plusieurs cartes à partir d'un fichier Excel :

```bash
node loadExcelFileToEncode.js
```

- Une fenêtre de sélection de fichier s'ouvrira pour choisir le fichier Excel
- Le fichier Excel doit contenir deux colonnes :
  - `path` : Le code à encoder
  - `encoded` : Statut d'encodage (laissé vide pour les cartes à encoder)
- Le programme encodera automatiquement chaque carte non encodée

## Structure du Projet

- `index.js` : Script principal pour l'encodage interactif
- `loadExcelFileToEncode.js` : Script pour l'encodage batch depuis Excel
- `SEKAOP_Script/` : Dossier contenant les scripts spécifiques
- `node_modules/` : Dépendances du projet

## Dépannage

1. **Erreur de lecteur NFC**

   - Vérifiez que le lecteur NFC est correctement connecté
   - Assurez-vous que les pilotes sont installés

2. **Erreur d'encodage**

   - Vérifiez que la carte NFC est compatible
   - Assurez-vous que la carte n'est pas en lecture seule

3. **Erreur de fichier Excel**
   - Vérifiez le format du fichier Excel
   - Assurez-vous que les colonnes sont correctement nommées

## Sécurité

- Les cartes sont encodées avec un format NDEF spécifique
- Un système de protection est implémenté sur les blocs 43 et 44
- Les URLs sont encapsulées selon le standard NDEF

## Limitations

- Taille maximale du message NDEF : 65534 bytes
- Format d'URL spécifique requis : `https://ecardnfc.fr/<code>`

## Support

En cas de problème, veuillez contacter le développeur ou ouvrir une issue sur le repository.

## Licence

ISC
