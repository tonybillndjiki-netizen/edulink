# Edulink Quiz — Classes et import Excel

Cette édition prolonge le projet Netlify existant `quiz-marketing-m2-tonybill`.

## Utilisation

1. Ouvrir `/teacher.html` et saisir le PIN enseignant déjà configuré.
2. Dans **Mes classes**, créer ou modifier une classe et ses cours. B3 Tronc commun, B3 CDUI et M2 Marketing & Communication sont disponibles dès l’ouverture.
3. Dans **Mes quiz**, choisir **Nouveau quiz** ou **Importer Excel**. Télécharger le modèle dans l’éditeur si nécessaire.
4. Choisir la feuille du classeur et la ligne des en-têtes. Associer les colonnes de son propre fichier si elles diffèrent du modèle.
5. Vérifier les questions, leurs choix et le corrigé. Cocher une réponse pour un QCM simple ou plusieurs réponses pour un QCM multiple. Les explications sont facultatives.
6. **Enregistrer le quiz** conserve le contenu. Les questions sans corrigé restent en brouillon. **Enregistrer et lancer** exige un corrigé complet.
7. Choisir une classe et une durée. La nouvelle session s’ouvre en salle d’attente dans `/live.html?session=CODE`.
8. Partager le lien étudiant ou le QR code. Avec ce lien, l’étudiant saisit uniquement son prénom.
9. Démarrer, mettre en pause, verrouiller les réponses, afficher la correction et avancer dans les questions depuis le pilotage.
10. Dans **Sessions live**, retrouver les séances et exporter leurs résultats CSV depuis leur tableau de pilotage.

Le diagnostic de 7 questions et NÉO FIT de 12 questions sont conservés. NÉO FIT conserve son challenge final et sa carte surprise. Les copies modifiables portent sur les questions ordinaires ; les activités spéciales restent disponibles dans le quiz NÉO FIT d’origine.

## Fichier Excel

Format `.xlsx` ou `.csv`, 5 Mo maximum, 200 questions par quiz. Une question par ligne.

| Colonne | Contenu |
| --- | --- |
| Question | Énoncé |
| Choix A, Choix B | Deux choix au minimum |
| Choix C à Choix F | Choix supplémentaires facultatifs |
| Bonne(s) réponse(s) | `B` pour une réponse, `A;C` pour plusieurs. Cellule vide pour définir le corrigé dans l’application. |
| Thème | Notion ou compétence évaluée |
| Explication | Justification de la bonne réponse |

Les intitulés des colonnes peuvent être différents : l’écran d’import permet de les associer. Les lignes sans énoncé sont signalées et ignorées. Les réponses non reconnues sont signalées et doivent être cochées dans l’éditeur. Les anciens fichiers `.xls` doivent être enregistrés en `.xlsx`. Les fichiers protégés par un mot de passe doivent être déverrouillés avant import.

## Sauvegarde et sessions

Les classes, les quiz et les réponses sont enregistrés côté serveur dans Netlify Blobs. Les brouillons non enregistrés restent temporairement sur l’appareil du professeur. Les sessions sont distinctes par code et peuvent fonctionner en parallèle. Chaque session conserve une copie de ses questions et de son corrigé : la modification ultérieure d’un quiz ne change pas une séance déjà créée. Les sessions et réponses d’une ancienne version NÉO FIT sont conservées lors de sa migration.

Les résultats et corrigés complets ne sont accessibles qu’avec le PIN enseignant. Les bonnes réponses sont masquées aux étudiants avant leur révélation. Un envoi déjà enregistré ne peut pas être remplacé, même lors d’envois simultanés. Les données de production sont indépendantes des déploiements de prévisualisation.

## Déploiement sur le site existant

Node.js 22 ou plus récent et accès réseau à npm / Netlify sont nécessaires. Le glisser-déposer du seul dossier `public` ne suffit pas à publier la fonction et la sauvegarde live.

```bash
npm ci
npx netlify login
npm run deploy
```

Le site cible est déjà renseigné : `f126b91d-9f86-4542-84ce-03e8138597f3`. Le PIN doit être fourni dans la variable Netlify `TEACHER_PIN`, avec portée **Functions**. Aucune valeur secrète n’est incluse dans les fichiers.

Après déploiement, vérifier :

- professeur : `https://quiz-marketing-m2-tonybill.netlify.app/teacher.html` ;
- étudiant : `https://quiz-marketing-m2-tonybill.netlify.app/` ;
- création d’une classe, import du modèle et lancement d’une session depuis deux appareils.

## Validation réalisée pour cette édition

`npm test` exécute dix tests de logique : accès enseignant, classes, import CSV, brouillons, réponses simultanées de 24 étudiants, sessions distinctes, scores QCM simple et multiple, migration NÉO FIT, protection des corrigés, enregistrement depuis deux onglets et pause sans pénalité sur le chronomètre ou le bonus.

La fonction a été compilée avec Netlify CLI. Le parcours complet a été testé dans Chromium avec la véritable fonction, Netlify Dev et le stockage Blobs local : création d’une classe, import du modèle `.xlsx`, vérification des réponses A / C / B+C, lancement d’une séance, deux appareils étudiants, salle d’attente, pause et reprise, correction, scores de 100 % et 33 %, export CSV et historique. Les interfaces professeur et étudiant ont été vérifiées sur mobile à 390 × 844. Aucune erreur JavaScript n’a été relevée.

Les sauvegardes utilisent les écritures conditionnelles de Netlify Blobs afin d’éviter l’écrasement des réponses ou des modifications provenant d’un autre onglet. Une compatibilité avec le stockage local Netlify est incluse lorsque les lectures ne renvoient pas directement leur ETag. Les commandes de pilotage attendent la fin de l’action en cours ; une ancienne actualisation ne remplace pas un état de session plus récent.

Ces contrôles valident la version préparée localement. Ils ne constituent pas une confirmation de publication sur l’URL Netlify. L’édition reste à publier sur le site existant après connexion au compte autorisé.

L’import Excel utilise le décompresseur Pako fourni localement avec sa licence. Le QR code du pilotage utilise le service externe QRServer ; le lien étudiant reste accessible et copiable indépendamment de ce service.
