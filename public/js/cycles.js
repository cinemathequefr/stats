_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });

$(run);

function run () {
  "use strict";

  console.log(moment().isAfter("2017-06-02", "day"));

  $.getJSON("data/cycles/aggregate.json", function (data) {
    data = _(data).mapValues(function (v, k) {
      return _({}).assign(v, { idCycle: parseInt(k, 10) }).value();
    })
    .values()
    .sortBy("dateFrom")
    .reverse()
    .value();


    // console.log

    var sortOrder;

    var table = d3
      .select(".cycles")
      .append("table")
      .html([
        "<colgroup><col/><col/><col/><col/><col/><col/></colgroup>",
        "<thead>",
        "<tr>",
        "<th>Dates</th>",
        "<th>Jours</th>",
        "<th>Titre</th>",
        "<th>Séances</th>",
        "<th>Entrées</th>",
        "<th>Entr./séance</th>",
        "<th>Taux rempl.</th>",
        "</tr>",
        "</thead>"
      ].join(""));

    table.selectAll("thead th").on("click", function (e, col) {
      var sort = [
        function (data, order) { return _.orderBy(data, function (item) { return item.dateFrom; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.duration; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.title; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.seances; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.entrees; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.moyEntreesSeance; }, order); },
        function (data, order) { return _.orderBy(data, function (item) { return item.global.tauxRemplissage; }, order); }
      ];
      sortOrder = (sortOrder === "asc" ? "desc" : "asc");
      data = sort[col](data, sortOrder); // Important: data must be mutated
      update(data);
    });

    table = table.append("tbody");
    update(data);


    function update (data) {
      var rows = table.selectAll("tr").data(data);

      rows
        .selectAll("td")
        .data(function (item) { return _.fill(Array(7), item); })
        .each(function (item, i) {
          [
            function (el, item) { el.html(period(moment(item.dateFrom).format("D MMM YYYY"), moment(item.dateTo).format("D MMM YYYY"))); },
            function (el, item) { el.html(item.duration); },
            function (el, item) { el.html(item.title); },
            function (el, item) { el.html(item.global.seances); },
            function (el, item) { el.html(format('### ##0,#', item.global.entrees)); },
            function (el, item) { el.html(format('### ##0,0', item.global.moyEntreesSeance)); },
            function (el, item) { el.html(format('#0,0', item.global.tauxRemplissage * 100)); }
          ][i](d3.select(this), item)
        });

      rows.enter()
        .append("tr")
        .selectAll("td")
        .data(function (item) { return _.fill(Array(7), item); })
        .enter()
        .append("td")
        .each(function (item, i) {
          [
            function (el, item) { el.html(period(moment(item.dateFrom).format("D MMM YYYY"), moment(item.dateTo).format("D MMM YYYY"))); },
            function (el, item) { el.html(item.duration); },
            function (el, item) { el.html(item.title); },
            function (el, item) { el.html(item.global.seances); },
            function (el, item) { el.html(format('### ##0,#', item.global.entrees)); },
            function (el, item) { el.html(format('### ##0,0', item.global.moyEntreesSeance)); },
            function (el, item) { el.html(format('#0,0', item.global.tauxRemplissage * 100)); }
          ][i](d3.select(this), item)
        });

    }
  });
}


function period (date1, date2) {
  var pattern = /(\d{1,2})\s(.*)\s(\d{4})/;
  var d1 = date1.match(pattern).splice(1, 3);
  var d2 = date2.match(pattern).splice(1, 3);
  var p  = function (a, b) {
    var b2 = b.slice(0); // Clone var
    var i = a.length - 1;
    if (a[i] === b[i] && i > -1) {
      i--;
      a.pop();
      b.pop();
      p(a, b);
    }
    return a.length === 0 ? b2.join(" ") : [a.join(" "), b2.join(" ")].join("-");
  };
  return p(d1, d2);
}

