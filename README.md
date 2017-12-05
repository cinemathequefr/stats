# Statistiques salles de cinéma

## Données utilisées

On utilise les données provenant des 8 champs suivants :

* Transaction:Canal de vente:ID => idCanal
* Place:Produit:ID => idManif
* Place:Produit:Nom => titre
* Place:Représentation:ID => idSeance
* Place:Représentation:Début (clé de tri) => date
* Place:Lieu:ID => idSalle
* Place:Tarif:ID => tarif
* Place:Tarif:Montant => montant

Comme critères de requête sur Digitick, on utilise uniquement les dates de début et fin (pas de "regroupements" ou autre). Cette requête renvoie également les données hors salles de cinéma, mais un filtrage est effectué au moment de la conversion JSON.

## Opérations

**convert.js** lit un fichier .csv (extraction Digitick) et construit un fichier de données JSON avec regroupement par séances.

**aggregate.js** lit les données JSON de séances (ci-dessus) et produit une agrégation hebdomadaire : les données sont toutes celles présentes actuellement sur le table "Synthèse par salle", qui est ajoutée au fichier de données JSON aggregate.json.
Une agrégation globale (ensemble des données) est recalculée et également inscrits dans ce fichier.

Pour l'agrégation hebdomadaire, on aura les variables (pour chaque salle et l'ensemble des salles) :

* seances
* entrees
* entreesPayant
* entreesLP
* entreesGratuit
* web
* recette
* moyEntreesSeance
* moyRecetteSeance
* moyRecetteEntree
* tauxRemplissage


Pour l'agrégation globale, on aura les variables (pour chaque salle et l'ensemble des salles) :

* seances
* moySeancesSemaine
* entrees
* moyEntreesSemaine
* entreesPayant
* moyEntreesPayantSemaine
* entreesLP
* moyEntreesLPSemaine
* entreesGratuit
* moyEntreesGratuitSemaine
* web
* moyWebSemaine
* recette
* moyRecetteSemaine
* moyEntreesSeance
* moyRecetteSeance
* moyRecetteEntree
* tauxRemplissage

## TODO

* Sur les indicateurs (en particulieurs ceux de type "moyenne" / "taux"), un graphique qui rende compte de l'évolution de la valeur sur les jours de la semaine en cours, en superposition avec la moyenne historique de cette valeur.
(Ainsi que la détection des semaines de profil similaire).

* Optionnellement, sur l'histogramme Synthèse, en superposition aux barres hebdomadaires, des barres qui indiquent pour chaque semaine la valeur provisoire sur la période du lundi jusqu'au jour de la semaine actuel. Par exemple, si les données de la semaine en cours vont jusqu'au jeudi (si nous sommes vendredi), on peut comparer la valeur pour toutes les semaines passées sur la période lundi-jeudi.


## Notes

2017-03-31 : on peut spécifier dans **data/excludeSeances.json** des id de séances à exclure des agrégations hebdomadaires. Pour chaque semaine concernée par une/des séances à exclure, il faut exécuter **node convert** pour que l'entrée concernée dans **public/data/aggregate.json** prenne en compte l'exclusion.
2017-05-04 : dans **public/data/aggregate.json**, on ajoute un champ calculé `moyRecetteEntreePayant` donnant la moyenne de recette par billet payant (à comparer `moyRecetteEntree` qui inclut l'ensemble des billets).

## Cycles

Opération manuelle d'ajout des données d'un cycle :


* Dans l'admin Digitick, extraire les données du cycle ("Etiquette") pour la variable Place:Représentation:ID.
* Transformer (manuellement) les données CSV en tableau JSON
* Dédoublonner les valeurs avec Lodasher : `_(data).uniq().sort().value()`
* Ajouter une entrée dans **public/data/static/cycle-seances.json** : l'ID NOS du cycle (clé) et le tableau obtenu dans Lodasher (valeur)
* Ajouter une entrée contenant les informations sur le cycle dans **public/data/static/cycle.json**
* Exécuter le script cycle avec l'ID du cycle en argument




2017-05-19 : l'interface Digitick permet de récupérer séparément des informations concernant les cycles, via le champ Etiquette.
On peut faire une requête en sélectionnant une valeur d'étiquette (correspondant à un cycle) et choisir en sortie la seul variable Place:Représentation:ID.
Le fichier CSV obtenu peut ensuite être manuellement converti en array JSON. Il faut ensuite dédoublonner les valeurs (puisqu'il y a une par billet), par exemple dans Lodasher :
`_(data).uniq().sort()`.
Le résultat est intégré (à la main) dans le fichier **public/data-static/cycle-seance.json**, et un script pourra ajouter les données de cycle au fichier général **public/data/seances.json**.
Il faudra quand même vérifier que la source Digitick est correcte et inclut bien toutes les séances, et **surtout** que les séances rattachées à plusieurs cycles sont correctement saisies.

