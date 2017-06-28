_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });


/*
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.memoize = factory();
  }
}(this, function() {
  "use strict";

  var memoize = function(func) {
    var stringifyJson = JSON.stringify,
      cache = {};

    var cachedfun = function() {
      var hash = stringifyJson(arguments);
      return (hash in cache) ? cache[hash] : cache[hash] = func.apply(this, arguments);
    };

    cachedfun.__cache = (function() {
      cache.remove || (cache.remove = function() {
        var hash = stringifyJson(arguments);
        return (delete cache[hash]);
      });
      return cache;
    }).call(this);

    return cachedfun;
  };

  return memoize;
}));
*/


var config = {
  path: {
    local: "./public/data/",
    remote: "//constellation2/celluleweb/stats/data/"
  },
  capacity: { "1": 413, "2": 186, "3": 93 },
  codesTarifsLp: [1862576, 2003563, 1968650, 1863782, 1863730, 1862470],
  codesTarifsWeb: [7096, 7216]
};

// var periode = "isoWeekday";
// var periode = "monthFold";
// var periode = "slot";


var temp = _.template([
  "<table>",
  "<tr>",
  "<th>Période</th>",
  "<th>Séances</th>",
  "<th>Entrées</th>",
  "<th>Moy. entrées / séance</th>",
  "<th>Recette</th>",
  "<th>Moy. recette / entrée</th>",
  "<th>Taux de remplissage</th>",
  "</tr>",
  "<% _.forEach(data, function (row) { %>",
  "<tr>",
  // "<td class='center'>{{ (grouping[periode][1]) }}</td>", // TODO: afficher correctement le label de chaque ligne
  "<td class='center'>{{ row[0] }}</td>",
  "<td class='right'>{{ format('### ##0.', row[1].global.seances) }}</td>",
  "<td class='right'>{{ format('### ##0.', row[1].global.entrees) }}</td>",
  "<td class='right'>{{ format('# ##0,00', row[1].global.moyEntreesSeance) }}</td>",
  "<td class='right'>{{ format('# ##0,00 €', row[1].global.recette) }}</td>",
  "<td class='right'>{{ format('# ##0,00 €', row[1].global.moyRecetteEntree) }}</td>",
  "<td class='right'>{{ format('#0,0%',(row[1].global.tauxRemplissage) * 100) }}</td>",
  "</tr>",
  "<% }); %>",
  "</table>"
].join(""));


var grouping = { // La première valeur est la fonction de regroupement, la seconde le template à utiliser pour le label de chaque ligne (TODO)
  global: [true, "Global"],
  day: [function (d) { return d.moment.format("YYYY-MM-DD"); }, _.template("{{ d }}")], // Ne fonctionne pas
  week: [function (d) { return d.moment.format("YYYY-W"); }, "test"],
  month: [function (d) { return d.moment.format("YYYY-MM"); }, "test"],
  year: [function (d) { return d.moment.format("YYYY"); }, "test"],
  season: [
    function (d) {
      var  y = d.moment.year();
      return d.moment.isBefore(moment().year(y).month(8).day(15)) ? s(y - 1) : s(y);
      function s (y) { return y + "-" + (y + 1); }
    },
    "test"
  ],
  slot: [function (d) { return d.moment.format("HH:mm"); }, "test"],
  isoWeekday: [function (d) { return d.moment.isoWeekday(); }, "test"], // groups by weekday (creates keys "1", "2" ... "7"])
  weekFold: [function (d) { return d.moment.isoWeek(); }, "test"],
  monthFold: [function (d) { return d.moment.format("M"); }, "test"]
};


// var grouping = {
//   global: true,
//   day: function (d) { return d.moment.format("YYYY-MM-DD"); },
//   week: function (d) { return d.moment.format("YYYY-W"); },
//   month: function (d) { return d.moment.format("YYYY-MM"); },
//   year: function (d) { return d.moment.format("YYYY"); },
//   slot: function (d) { return d.moment.format("HH:mm") },
//   isoWeekday: function (d) { return [null, "01-Lun", "02-Mar", "03-Mer", "04-Jeu", "05-Ven", "06-Sam", "07-Dim"][d.moment.isoWeekday()]; }, // groups by weekday (creates keys "1", "2" ... "7")
//   weekFold: function (d) { return d.moment.isoWeek(); },
//   monthFold: function (d) { return [null, "01-Jan", "02-Fév", "03-Mar", "04-Avr", "05-Mai", "06-Juin", "07-Juil", "08-Aoû", "09-Sep", "10-Oct", "11-Nov", "12-Déc"][d.moment.format("M")]; }
// };

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



function compute (data, periode) {
  return _(group(data, periode))
    .mapValues(function (g) {
      return aggregateSeances(g);
    })
    .toPairs()
    .sortBy(function (d) { return parseInt(d[0], 10) || d[0]; })
    .value();
}

var comp = memoize(compute);


function render (periode) {
  $(".container table").remove();
  $("<div>").appendTo(".container").html(temp({ "data": comp(data, periode), "periode": periode }));
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

