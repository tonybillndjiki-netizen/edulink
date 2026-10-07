# Edulink

Plateforme pédagogique Bachelor 3 de MBN Global Education.

## Objectif

Edulink centralise les cours, la progression, les devoirs, les quiz, les contrôles continus, les résultats, les compétences, la présence et les intégrations pédagogiques.

## Déploiement cible

- Hébergement : Netlify
- Backend / Auth / Storage : Supabase
- Intégration prioritaire : Google Classroom
- Application responsive : ordinateur, tablette et smartphone

> Dépôt initialisé pour recevoir le code source de l'application Edulink.

## Quiz live — classes B3 et M2

Le module prêt à déployer se trouve dans `quiz-live/`. Il comprend la gestion des classes, l'import Excel des quiz, les sessions pilotées par le professeur, les résultats et l'export CSV.

Pour le projet Netlify existant `quiz-marketing-m2-tonybill`, utiliser la branche `main`, le dossier de base `quiz-live`, le dossier de publication `public` et les fonctions `netlify/functions`. Le fichier `quiz-live/netlify.toml` contient les paramètres du module. La variable `TEACHER_PIN` doit être disponible pour les Functions en production.

La compilation et le parcours professeur/étudiants ont été vérifiés localement ; la publication sur Netlify reste à confirmer.
