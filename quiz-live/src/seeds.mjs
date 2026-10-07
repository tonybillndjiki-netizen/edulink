const DIAGNOSTIC       = {
  id: "diagnostic",
  title: "Quiz diagnostique — Fondamentaux de l’acquisition digitale",
  shortTitle: "Diagnostic Acquisition",
  level: "Mastère 2 Marketing & Communication",
  description: "7 questions pour identifier rapidement les acquis avant l’UE Acquisition digitale.",
  questions: [
    {id:"d1", theme:"Acquisition digitale", competency:"Acquisition digitale", question:"Quel énoncé définit le mieux l’acquisition digitale ?", options:["Publier régulièrement sur les réseaux sociaux","Attirer et convertir de nouveaux prospects ou clients via des canaux numériques","Augmenter uniquement le nombre d’abonnés","Créer une identité visuelle cohérente"], correct:1, explanation:"L’acquisition vise un résultat business mesurable : lead, inscription, rendez-vous, achat, etc."},
    {id:"d2", theme:"Objectif SMART", competency:"Objectif SMART", question:"Lequel de ces objectifs est réellement SMART ?", options:["Augmenter les inscriptions","Faire mieux que les concurrents","Générer 400 candidatures qualifiées avant le 30 novembre avec un CPL inférieur à 20 €","Être plus visible sur Instagram"], correct:2, explanation:"Cet objectif est spécifique, mesurable et temporel, avec un résultat et un seuil de performance explicites."},
    {id:"d3", theme:"Persona", competency:"Persona", question:"À quoi sert principalement un buyer persona ?", options:["À inventer un client fictif pour illustrer une présentation","À représenter un client type avec ses objectifs, freins, comportements et déclencheurs","À remplacer l’étude de marché","À fixer automatiquement le budget média"], correct:1, explanation:"Le persona synthétise les caractéristiques utiles pour adapter l’offre, le message et le parcours."},
    {id:"d4", theme:"Funnel marketing", competency:"Funnel marketing", question:"Au BOFU (Bottom of Funnel), quel est l’objectif prioritaire ?", options:["Faire découvrir un problème","Développer la notoriété","Convaincre et convertir une personne déjà proche de l’action","Créer une communauté"], correct:2, explanation:"Le BOFU correspond à la phase où le prospect est prêt à agir : CTA, formulaire, rendez-vous, offre, garantie."},
    {id:"d5", theme:"CPL", competency:"CPL", question:"Une campagne dépense 3 600 € et génère 240 leads. Quel est son CPL ?", options:["10 €","12 €","15 €","24 €"], correct:2, explanation:"CPL = dépenses / leads = 3 600 / 240 = 15 €."},
    {id:"d6", theme:"Benchmark concurrentiel", competency:"Benchmark", question:"Quel est le rôle principal d’un benchmark concurrentiel avant une campagne ?", options:["Copier les concurrents les plus visibles","Comparer les pratiques du marché pour identifier écarts, opportunités et différenciation","Déterminer uniquement le prix de vente","Éviter toute analyse interne"], correct:1, explanation:"Le benchmark sert à comparer de façon structurée les concurrents pour orienter les choix stratégiques."},
    {id:"d7", theme:"Éléments du benchmark", competency:"Benchmark", question:"Quels éléments sont les plus pertinents à comparer dans un benchmark d’acquisition ?", options:["Offre, promesse, canaux, prix, formats, CTA et différenciation","Uniquement le nombre d’abonnés Instagram","Les goûts personnels du responsable marketing","Seulement le logo et les couleurs"], correct:0, explanation:"Le benchmark doit porter sur l’offre, le positionnement, les messages, les canaux, les formats et la mécanique de conversion."}
  ]
};

const NEOFIT       = {
  id: "neofit",
  title: "CAS PRATIQUE — STRATÉGIE MARKETING : NÉO FIT",
  shortTitle: "NÉO FIT",
  level: "Mastère 2 Marketing & Communication",
  description: "Cas live de raisonnement et de prise de décision en stratégie marketing.",
  context: "NÉO FIT est une nouvelle salle de sport en région parisienne. Budget initial : 40 000 € sur 6 mois. Objectif : 600 abonnés en 6 mois.",
  contextHtml: `
    <div class="casebox"><strong>NÉO FIT</strong> est une nouvelle salle de sport située en région parisienne. Elle veut se différencier des grandes chaînes de fitness.</div>
    <div class="casegrid">
      <div><span>Budget marketing</span><strong>40 000 € / 6 mois</strong></div>
      <div><span>Objectif</span><strong>600 abonnés en 6 mois</strong></div>
    </div>
    <div class="casebox"><strong>Offres :</strong> 35 €/mois · Premium 59 €/mois · coaching individuel · cours collectifs · application mobile personnalisée · coworking · 6h–23h · sans engagement.</div>
    <div class="segments"><div><b>A</b> Étudiants 18–25 ans · budget limité · TikTok</div><div><b>B</b> Jeunes actifs 25–35 ans · flexibilité · résultats rapides</div><div><b>C</b> Cadres 30–45 ans · pouvoir d’achat élevé · peu de temps</div><div><b>D</b> 45–60 ans · santé · accompagnement · sécurité</div><div><b>E</b> Sportifs réguliers · performance · équipements spécialisés</div></div>
  `,
  questions: [
    {id:"n1", theme:"Segmentation", competency:"Segmentation", type:"multi", question:"NÉO FIT utilise l’âge, le pouvoir d’achat, la fréquence de pratique sportive et les besoins recherchés. Quels types de critères de segmentation sont présents ?", options:["Critères démographiques / socio-économiques","Critères comportementaux","Critères liés aux besoins et bénéfices recherchés","Critères géographiques"], correct:[0,1,2], explanation:"Plusieurs familles sont combinées : âge et pouvoir d’achat, comportement de pratique, puis besoins/bénéfices recherchés. Aucun critère géographique n’est utilisé ici."},
    {id:"n2", theme:"Segmentation ou ciblage ?", competency:"Segmentation", question:"NÉO FIT divise son marché en étudiants, jeunes actifs, cadres, 45–60 ans et sportifs réguliers. Quelle étape marketing vient principalement d’être réalisée ?", options:["Ciblage","Segmentation","Positionnement","Marketing mix"], correct:1, explanation:"La segmentation consiste à découper le marché en groupes homogènes. Le ciblage viendra ensuite sélectionner les segments prioritaires."},
    {id:"n3", theme:"Ciblage", competency:"Ciblage", question:"NÉO FIT veut privilégier des consommateurs solvables, digitaux, en recherche de flexibilité et susceptibles d’utiliser l’offre Premium. Quel couple de segments est le plus cohérent ?", options:["Étudiants + 45–60 ans","Jeunes actifs + cadres","Étudiants + sportifs réguliers","45–60 ans + étudiants"], correct:1, explanation:"Jeunes actifs et cadres combinent davantage solvabilité, usage digital, besoin de flexibilité et potentiel Premium."},
    {id:"n4", theme:"Positionnement", competency:"Positionnement", question:"La cible prioritaire devient jeunes actifs + cadres. Quel positionnement est le plus cohérent ?", options:["La salle de sport la moins chère du marché","Votre espace fitness premium pour atteindre vos objectifs sans perdre de temps","Une salle pour absolument tout le monde","Le fitness exclusivement réservé aux sportifs professionnels"], correct:1, explanation:"Le positionnement B relie directement le niveau Premium aux besoins de résultats et de gain de temps des segments retenus."},
    {id:"n5", theme:"SWOT", competency:"SWOT", question:"« NÉO FIT possède une application mobile performante et intégrée à l’expérience de coaching. » Dans un SWOT, il s’agit principalement…", options:["d’une opportunité","d’une menace","d’une force","d’une faiblesse"], correct:2, explanation:"L’application est une ressource interne positive et différenciante : c’est donc une force."},
    {id:"n6", theme:"SWOT", competency:"SWOT", question:"« Fitness Park prévoit l’ouverture d’une nouvelle salle à 2 km de NÉO FIT. » Dans le SWOT, cela correspond principalement…", options:["Force","Faiblesse","Opportunité","Menace"], correct:3, explanation:"L’ouverture d’un concurrent proche est un facteur externe défavorable : une menace."},
    {id:"n7", theme:"Marketing mix", competency:"Marketing mix", question:"NÉO FIT veut conserver un positionnement Premium, mais propose un abonnement à 19,99 € et une campagne « le fitness le moins cher de la ville », tout en maintenant coaching et coworking Premium. Quel problème stratégique principal identifiez-vous ?", options:["Le marché est mal segmenté","Le marketing mix est incohérent avec le positionnement","L’entreprise doit supprimer son application","L’entreprise n’utilise pas la matrice BCG"], correct:1, explanation:"Le prix et la communication « moins cher » contredisent la promesse Premium. Le mix doit soutenir le positionnement, pas le fragiliser."},
    {id:"n8", theme:"Plan marketing", competency:"Plan marketing", question:"Quel ordre est le plus logique pour structurer le plan marketing de NÉO FIT ?", options:["Analyse du marché → objectifs → segmentation/ciblage → positionnement → actions marketing → mesure des résultats","Objectifs → actions → analyse → positionnement → mesure → ciblage","Positionnement → actions → objectifs → ciblage → analyse → mesure","Actions → budget → ciblage → analyse → objectifs → mesure"], correct:0, explanation:"Le plan part du diagnostic, fixe les objectifs, sélectionne les cibles, définit le positionnement, déploie les actions puis contrôle les résultats."},
    {id:"n9", theme:"Matrice BCG", competency:"BCG", question:"Trois ans plus tard, l’activité salle de fitness présente une forte croissance et une forte part de marché. Dans quelle catégorie BCG se situe-t-elle ?", options:["Vedette","Vache à lait","Dilemme","Poids mort"], correct:0, explanation:"Forte croissance + forte part de marché = Vedette (Star)."},
    {id:"n10", theme:"5 forces de Porter", competency:"Porter", question:"De nombreuses applications permettent désormais de faire du sport à domicile sans abonnement en salle. Dans les 5 forces de Porter, cela correspond principalement…", options:["au pouvoir des fournisseurs","à la menace des produits ou services de substitution","à la rivalité interne uniquement","au pouvoir des salariés"], correct:1, explanation:"Les applications de sport à domicile répondent au même besoin par une solution différente : ce sont des substituts."},
    {id:"n11", theme:"Analyse des performances", competency:"Analyse des performances", question:"Résultats : Meta Ads 8 000 € / 800 leads / 80 abonnements ; Google Ads 6 000 € / 300 leads / 90 abonnements ; TikTok Ads 4 000 € / 600 leads / 30 abonnements ; Retargeting 2 000 € / 150 leads / 75 abonnements. Quel canal génère le plus de leads ?", options:["Meta Ads","Google Ads","TikTok Ads","Retargeting"], correct:0, explanation:"Meta Ads génère 800 leads, soit le volume le plus élevé. Mais le volume seul ne dit pas quel canal transforme le mieux."},
    {id:"n12", theme:"Analyse des performances", competency:"Analyse des performances", question:"Avec les mêmes données, quel canal présente le meilleur taux de transformation lead → abonnement ?", options:["Meta Ads — 10 %","Google Ads — 30 %","TikTok Ads — 5 %","Retargeting — 50 %"], correct:3, explanation:"Meta : 80/800 = 10 %. Google : 90/300 = 30 %. TikTok : 30/600 = 5 %. Retargeting : 75/150 = 50 %. Le retargeting transforme le mieux."}
  ],
  challenge: {id:"challenge", theme:"Challenge final", competency:"Challenge final", question:"Vous êtes désormais responsable marketing de NÉO FIT. Budget : 20 000 €. Période : 3 mois. Objectif : 300 nouveaux abonnements. Quelle stratégie est la plus cohérente avec les données du cas ?", options:[
    "Cibler surtout les étudiants ; positionnement low-cost ; TikTok 10 k€, Meta 6 k€, Google 2 k€, retargeting 2 k€ ; KPI principal : nombre de leads.",
    "Prioriser jeunes actifs + cadres ; positionnement premium, flexible et orienté résultats ; Google 7 k€, retargeting 6 k€, Meta 5 k€, CRM/contenus 2 k€ ; KPI : abonnements, CAC, conversion et part Premium.",
    "Cibler les cinq segments de la même manière ; positionnement généraliste ; répartir 4 k€ sur cinq canaux ; KPI : portée et impressions.",
    "Cibler cadres uniquement ; positionnement premium ; TikTok 15 k€ et influence 5 k€ ; KPI : vues vidéo et engagement."
  ], correct:1, explanation:"La stratégie B aligne cible, positionnement et allocation avec la qualité observée sur Google/retargeting, tout en conservant Meta pour alimenter le funnel. Les KPI descendent jusqu’à l’abonnement et au CAC."},
  surprise: {
    title:"⚡ CHANGEMENT DE SITUATION",
    body:"Après analyse du CRM : 40 % des leads Meta ne répondent jamais ; 15 % ont de fausses coordonnées ; les leads Google prennent plus souvent rendez-vous ; le retargeting génère des prospects plus qualifiés. Le budget passe de 20 000 € à 14 000 € et il reste 30 jours.",
    question:{id:"surprise", theme:"Carte surprise", competency:"Décision stratégique", question:"Avec 14 000 € et 30 jours, quelle réallocation est la plus défendable ?", options:[
      "Conserver la répartition précédente : la quantité de leads Meta suffit à justifier le budget.",
      "Augmenter TikTok à 8 k€ pour maximiser le volume, puis répartir 6 k€ sur Meta.",
      "Prioriser Google (6 k€) et retargeting (5 k€), conserver 2 k€ sur Meta avec préqualification renforcée et 1 k€ pour CRM/créatifs de conversion ; piloter sur abonnements/CAC.",
      "Couper tous les canaux payants et consacrer 14 k€ uniquement à l’affichage local."
    ], correct:2, explanation:"La nouvelle donnée oblige à privilégier la qualité et la conversion : Google + retargeting, tout en gardant un Meta réduit et mieux qualifié. Le pilotage doit se faire sur les abonnements et le CAC, pas sur le volume brut de leads."}
  }
};

const QUIZZES                       = { diagnostic: DIAGNOSTIC, neofit: NEOFIT };

export { QUIZZES };
