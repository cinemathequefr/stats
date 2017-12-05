// Aggregate
// La fonction d'agrégation (dans convert.js) a une portée générale : quelle que soit le "segment" de données de séances qu'on lui fournit,
// elle génère de la même façon une agrégation de ces données (qu'il s'agit d'une semaine, d'un mois, d'un cycle...)

var _ = require("lodash");
var config = require("./config.js");

function aggregateSeances (seances) {
  console.log(seances);
  return _({})
  .assign(   // Répartit les séances dans 3 groupes correspondant à leur salle
    { 1: [], 2: [], 3: [] },
    _(seances)
      .filter(item => !item.exclude)
      .groupBy(b => b.salle.id)
      .value()
  )
  .mapValues(function (c, i) { // Agrège les données de chaque salle
    return {
      seances: c.length,
      capacite: c.length * config.capacity[i],
      entrees: _(c).sumBy(function (d) { return d.tickets.compte }),
      entreesPayant: _(c).sumBy(function (d) { return d.tickets.tarifCat.payant }),
      entreesLP: _(c).sumBy(function (d) { return d.tickets.tarifCat.lp }),
      entreesGratuit: _(c).sumBy(function (d) { return d.tickets.tarifCat.gratuit }),
      web: _(c).sumBy(function (d) { return d.tickets.web }),
      recette: _(c).sumBy(function (d) { return d.tickets.recette })
    };
  })
  .thru(function (b) { // Calcule la somme des valeurs pour les trois salles et l'inscrit dans une propriété global
    var ks = _.keys(b["1"]);
    return _(b)
      .assign({
        "global": _
          .zipObject(
            ks,
            _.map(ks, function (k) {
              return _(b).reduce(function (acc, val) {
                return val[k] + acc;
              }, 0);
            })
          )
      })
      .value();
  })
  .thru(function (b) {  // Pour chaque salle + global, calcule et inscrit les moyennes
    return _(b).mapValues(function (c) {
      return _(c).assign({
        moyEntreesSeance: c.entrees / c.seances,
        moyRecetteSeance: c.recette / c.seances,
        moyRecetteEntree: c.recette / c.entrees,
        moyRecetteEntreePayant: c.recette / c.entreesPayant,
        tauxRemplissage: c.entrees / c.capacite
      }).value();
    }).value();
  })
  .value();
}

module.exports = aggregateSeances;