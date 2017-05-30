_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });

$(run);

function run () {
  "use strict";

  $.getJSON("data/cycles/aggregate.json", function (data) {
    data = _(data).mapValues(function (v, k) {
      return _({}).assign(v, { idCycle: parseInt(k, 10) }).value();
    })
    .values()
    .sortBy("dateFrom")
    .value();

    var sortOrder = "desc";

    var table = d3
      .select(".cycles")
      .append("table")
      .html([
        "<colgroup><col class='date'/><col/><col/><col/><col/><col/></colgroup>",
        "<thead>",
        "<tr>",
        "<th>Date</th>",
        "<th>Titre</th>",
        "<th>Séances</th>",
        "<th>Entrées</th>",
        "<th>Entrées/séance</th>",
        "<th>Taux rempl.</th>",
        "</tr>",
        "</thead>"
      ].join(""));


    table.selectAll("thead th").on("click", function (e, col) {
      var sort = [
        function (data, order) { return _.orderBy(data, function (item) { return item.dateFrom; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.title; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.seances; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.entrees; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.moyEntreesSeance; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.tauxRemplissage; }, order); }
      ];
      data = sort[col](data, sortOrder); // Important: data must be mutated
      update(data);
      sortOrder = (sortOrder === "desc" ? "asc" : "desc");
    });

    table = table.append("tbody");
    update(data);


    function update (data) {
      var rows = table.selectAll("tr").data(data);

      rows
        .selectAll("td")
        .data(function (item) { return _.fill(Array(6), item); })
        .each(function (item, i) {
          [
            function (el, item) { el.html(moment(item.dateFrom).format('D MMM YYYY')) },
            function (el, item) { el.html(item.title) },
            function (el, item) { el.html(item.global.seances) },
            function (el, item) { el.html(format('### ##0,#', item.global.entrees)) },
            function (el, item) { el.html(format('### ##0,0', item.global.moyEntreesSeance)) },
            function (el, item) { el.html(format('#0,0', item.global.tauxRemplissage * 100)) }
          ][i](d3.select(this), item)
        });

      rows.enter()
        .append("tr")
        .selectAll("td")
        .data(function (item) { return _.fill(Array(6), item); })
        .enter()
        .append("td")
        .each(function (item, i) {
          [
            function (el, item) { el.html(moment(item.dateFrom).format('D MMM YYYY')) },
            function (el, item) { el.html(item.title) },
            function (el, item) { el.html(item.global.seances) },
            function (el, item) { el.html(format('### ##0,#', item.global.entrees)) },
            function (el, item) { el.html(format('### ##0,0', item.global.moyEntreesSeance)) },
            function (el, item) { el.html(format('#0,0', item.global.tauxRemplissage * 100)) }
          ][i](d3.select(this), item)
        });

    }
  });
}




/*
var temp = _.template([
  "<table>",
  "<tr>",
  "<th style='width: 5%;'>Date</th>",
  "<th style='width: 12%;'>Titre</th>",
  "<th style='width: 3%;'>Séances</th>",
  "<th style='width: 3%;'>Entrées</th>",
  "<th style='width: 3%;'>Entrées/séance</th>",
  "<th style='width: 3%;'>Taux rempl.</th>",
  "</tr>",
  "<% _.forEach(data, function (item) { %>",
  "<tr>",
  "<td class='center'>{{ moment(item.dateFrom).format('D MMM YYYY') }}</td>",
  "<td>{{ item.idCycle }} - {{ item.title }}</td>",
  "<td class='center'>{{ item.global.seances }}</td>",
  "<td class='center'>{{ format('### ##0,#', item.global.entrees) }}</td>",
  "<td class='center'>{{ format('### ##0,0', item.global.moyEntreesSeance) }}</td>",
  "<td class='center'>{{ format('#0,0', item.global.tauxRemplissage * 100) }}</td>",
  "</tr>",
  "<% }); %>",
  "</table>"
].join(""));

$(run);

function run () {
  "use strict";
  $.getJSON("data/cycles/aggregate.json", function (data) {
    var o = _(data).mapValues(function (v, k) {
      return _({}).assign(v, { idCycle: parseInt(k, 10) }).value();
    })
    .values()
    .sortBy("dateFrom")
    .value();

    $("<div>").appendTo(".container").html(temp({ "data": o }));
  });
}
*/