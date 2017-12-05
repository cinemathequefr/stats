// _.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });

var config = {
  path: {
    local: "./public/data/",
    remote: "//constellation2/celluleweb/stats/data/"
  },
  capacity: { "1": 413, "2": 186, "3": 93 },
  codesTarifsLp: [1862576, 2003563, 1968650, 1863782, 1863730, 1862470],
  codesTarifsWeb: [7096, 7216]
};

var temp = _.template([
  "<table>",
  "<thead>",
  "<tr>",
  "<th>Période</th>",
  "<th>Séances</th>",
  "<th>Entrées</th>",
  "<th>Moy. entrées / séance</th>",
  "<th>Recette</th>",
  "<th>Moy. recette / entrée</th>",
  "<th>Taux de remplissage</th>",
  "</tr>",
  "</thead>",
  "<tbody>",
  "<% _.forEach(data, function (row) { %>",
  "<tr>",
  "<td data-periode='<%= row[0] %>' class='center'><%= grouping[periode][1]({ d: row[0] }) %></td>", // TODO: afficher correctement le label de chaque ligne
  // "<td class='center'><%= row[0] %></td>",
  "<td class='right'><%= format('### ##0.', row[1].global.seances) %></td>",
  "<td class='right'><%= format('### ##0.', row[1].global.entrees) %></td>",
  "<td class='right'><%= format('# ##0,00', row[1].global.moyEntreesSeance) %></td>",
  "<td class='right'><%= format('# ##0,00 €', row[1].global.recette) %></td>",
  "<td class='right'><%= format('# ##0,00 €', row[1].global.moyRecetteEntree) %></td>",
  "<td class='right'><%= format('#0,0%',(row[1].global.tauxRemplissage) * 100) %></td>",
  "</tr>",
  "<% }); %>",
  "</tbody>",
  "</table>"
].join(""));


var grouping = { // La première valeur est la fonction de regroupement, la seconde le template à utiliser pour le label de chaque ligne (TODO)
  global: [true, _.template("Global")],
  day: [function (d) { return d.moment.format("YYYY-MM-DD"); }, _.template("<%= moment(d).format('ddd D MMM YYYY') %>")],
  week: [function (d) { return d.moment.format("YYYY-[W]WW"); },  _.template("<%= moment(d).format('YYYY [semaine] W') %>")],
  month: [function (d) { return d.moment.format("YYYY-MM"); },  _.template("<%= moment(d).format('MMM YYYY') %>")],
  year: [function (d) { return d.moment.format("YYYY"); },   _.template("<%= d %>")],
  season: [ // Période allant de la réouverture (fin août) jusqu'à la fermeture annuelle d'été
    function (d) {
      var  y = d.moment.year();
      return d.moment.isBefore(y + "-08-15") ? s(y - 1) : s(y);
      // return d.moment.isBefore(moment().year(y).month(8).day(15)) ? s(y - 1) : s(y); // BUG : renvoie des séances dans la saison 2014-2015
      function s (y) { return y + "-" + (y + 1); }
    },
    _.template("<%= d %>")
  ],
  slot: [function (d) { return d.moment.format("HH:mm"); }, _.template("<%= d %>")],
  isoWeekday: [function (d) { return d.moment.isoWeekday(); }, _.template("<%= [null, 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][d] %>")], // groups by weekday (creates keys "1", "2" ... "7"])
  weekFold: [function (d) { return d.moment.isoWeek(); }, _.template("Semaine <%= d %>")],
  monthFold: [function (d) { return d.moment.format("M"); }, _.template("<%= [null, 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'][d] %>")]
};

var data;

$(function () {
  $.getJSON("../../data/seances.json")
  .then(function (d) {
    data = d;
    $("select").on("change", function () {
      render(this.value);
    });

    $("select").val("global").change();

  });
});


var compute = memoize(function (periode) { // TODO: use _.memoize (instead of extra dependency memoize.js)
  return _(group(data, periode)) // NB : data is a reference external to this function
    .mapValues(function (g) {
      return aggregateSeances(g);
    })
    .toPairs()
    .sortBy(function (d) { return parseInt(d[0], 10) || d[0]; })
    .value();
});


function render (periode) {
  // TODO: less dirty
  $(".container table").remove();
  $("<div>").appendTo(".container").html(temp({ "data": compute(periode), "periode": periode }));
  $("table").stickyTableHeaders({cacheHeaderHeight: true});
}


function group (data, grp) {
  return _(data)
  .map(function (d) {
    return _({}).assign(d, { moment: moment(d.date) }).value(); // Adds the `moment` value to each datum
  })
  .groupBy(grouping[grp][0])
  .value();
}

function aggregateSeances (seances) {
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

