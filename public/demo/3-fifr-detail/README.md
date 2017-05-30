Détail des entrées FIFR 2017 par séance
2017-03-07

Le fichier de données **fifr2017.json** est généré par le script **tools/fifr2017**, qui convertit l'extraction .csv en données JSON agrégées, avec deux nouveautés :

* La catégorisation tarifaire est plus détaillée (que dans la vue générale actuelle des statistiques) : 
  * Libre pass gratuit
  * Libre pass payant (frais de réservation web, master classes...)
  * Gratuit (basé uniquement sur un montant de ticket à 0 €)
  * Plein tarif
  * Tarif réduit
  * Autres (attrape tous les codes tarifs non listés explicitement dans les catégorisations précédentes)
* On fait un compte des tickets non scannés, ainsi que la ventilation tarifaire de ces tickets dans les catégories ci-dessus

