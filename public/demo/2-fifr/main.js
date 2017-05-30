_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });

var temp = _.template([
  "<h2>{{ moment(data.detail[0][0]).format('YYYY') }}</h2>",
  "<table>",
  "<tr>",
  "<th>Date</th>",
  "<th>Séances</th>",
  "<th>Entrées</th>",
  "<th>Moyenne entrées / séance</th>",
  "<th>Recette</th>",
  "<th>Taux de remplissage</th>",
  "</tr>",
  "<% _.forEach(data.detail, function (row) { %>",
  "<tr>",
  "<td class='center'>{{ moment(row[0]).format('ddd D MMM YYYY') }}</td>",
  "<td class='right'>{{ row[1].global.seances }}</td>",
  "<td class='right'>{{ format('### ###.', row[1].global.entrees) }}</td>",
  "<td class='right'>{{ format('# ###,00', row[1].global.moyEntreesSeance) }}</td>",
  "<td class='right'>{{ format('# ###,00 €', row[1].global.recette) }}</td>",
  "<td class='right'>{{ format('#0,0%',(row[1].global.tauxRemplissage) * 100) }}</td>",
  "</tr>",
  "<% }); %>",
  "<tr class='total'>",
  "<td class='center'>Total</td>",
  "<td class='right'>{{ data.total.global.seances }}</td>",
  "<td class='right'>{{ format('### ###.', data.total.global.entrees) }}</td>",
  "<td class='right'>{{ format('# ###,00', data.total.global.moyEntreesSeance) }}</td>",
  "<td class='right'>{{ format('# ###,00 €', data.total.global.recette) }}</td>",
  "<td class='right'>{{ format('#0,0%',(data.total.global.tauxRemplissage) * 100) }}</td>",
  "</tr>",
  "</table>"
].join(""));


$(function () {
  var dates = {
    "2016": { from: moment("2016-02-03"), to: moment("2016-02-08") },
    "2017": { from: moment("2017-03-01"), to: moment("2017-03-06") }
  };

  $.getJSON("../../data/seances.json", function (data) {

    // Compute an aggregation per date
    var o = _(dates)
    .map(function (a) {
      return _(aggregate(
        _(data)
        .filter(function (b) {
          return moment(b.date).isBetween(a.from, a.to, null, "()")
        })
        .groupBy(function (b) {
          return moment(b.date).format("YYYY-MM-DD");
        })
        .value()
      ))
      .toPairs()
      .value();
    })
    .value();

    // From the initial data again, compute an aggregation for total (manual "grouping" under the `total`)
    var p = _(dates)
    .map(function (a) {
      return aggregate({
        total: _(data)
        .filter(function (b) {
          return moment(b.date).isBetween(a.from, a.to, null, "()")
        })
        .value()
      })
    })
    .value();

    $("<div>").appendTo(".container").html(temp({ "data": _({ "detail": o[1] }).assign(p[1]).value() }));
    $("<div>").appendTo(".container").html(temp({ "data": _({ "detail": o[0] }).assign(p[0]).value() }));

  });
});


/**
 * aggregate
 * @param (Object) data: a dataset grouped by key (each value is an array : eg { "2017-01-01": [ {...},{...},{...} ], "2017-01-02": [ {...},{...},{...} ] }
 * @return (Object) a dataset grouped by key (each value is the aggregation of the corresponding collection: { "2017-01-01": {...}, "2017-01-02": {...} })
 */
function aggregate(data) {
  const CAPACITY = { 1: 413, 2: 186, 3: 93 };
  return _(data).mapValues(function (datum) {
    return _({})
    .assign(
      { 1: [], 2: [], 3: [] },
      _(datum).groupBy(function (b) { return b.salle.id; }).value()
    )
    .mapValues(function (c, i) {
      return {
        seances: c.length,
        capacite: c.length * CAPACITY[i], // Potential attendance
        entrees: _(c).sumBy(function (d) { return d.tickets.compte }),
        entreesPayant: _(c).sumBy(function (d) { return d.tickets.tarifCat.payant }),
        entreesLP: _(c).sumBy(function (d) { return d.tickets.tarifCat.lp }),
        entreesGratuit: _(c).sumBy(function (d) { return d.tickets.tarifCat.gratuit }),
        web: _(c).sumBy(function (d) { return d.tickets.web }),
        recette: _(c).sumBy(function (d) { return d.tickets.recette })
      };
    })
    .thru(function (b) { // Computes sum in a "global" object (TODO: use `_.tap` for consistency)
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
    .tap(function (b) {
      _(b).forEach(function (c) { // Computes averages and percent
        _(c).assign({
          moyEntreesSeance: c.entrees / c.seances,
          moyRecetteSeance: c.recette / c.seances,
          moyRecetteEntree: c.recette / c.entrees,
          tauxRemplissage: c.entrees / c.capacite
        }).value();
      });
    })
    .value();
  })
  .value();
}

