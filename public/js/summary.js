// Important: he.js is used to escape the template strings placed in a JSON-encoded object in a data- attribute
var summary = (function () {
  "use strict";

  function render(container, data, week) {

    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
    var temp = _.template([
      "<table class='summaryTable'>",
      "<colgroup><col></col><% _.forEach(table.cols, function (col) { %><col></col><% }); %></colgroup>",
      "<thead><tr><th>{{ table.week }}</th><% _.forEach(table.cols, function (col) { %><th class='{{ col.class }}'>{{ col.header }}</th><% }); %></tr></thead>",
      "<tbody>",
      "<% _.forEach(table.rows, function (row) { %><tr class='{{row.class}}'><th>{{ row.header }}</th>",
      "<% _.forEach(table.cols, function (col) { %>",
      "<td class='{{col.class}}' data-template='' data-cell='{&quot;salle&quot;: &quot;{{ col.segment }}&quot;, &quot;variable&quot;: &quot;{{ row.variable }}&quot;, &quot;template&quot;: &quot;{{ he.escape(row.template) }}&quot;}'>",
      "{{ _.template(row.template)(table.data[col.segment]) }}",
      "</td><% }); %>",
      "</tr><% }); %>",
      "</tbody>",
      "</table>"
    ].join(""));

    var tableLayout = {
      cols: [
        { segment: "global", header: "Toutes salles", class: "bold" },
        { segment: "1", header: "Salle HL" },
        { segment: "2", header: "Salle GF" },
        { segment: "3", header: "Salle JE" }
      ],
      rows: [
        { variable: "seances", template: "{{ format('### ##0,#', seances) }}", header: "Séances" },
        { variable: "entrees", template: "{{ format('### ##0,#', entrees) }}", header: "Entrées" },
        { variable: "entreesPayant", template: "{{ format('### ##0,#', entreesPayant) }} ({{ format('### ##0,0', (entreesPayant / entrees * 100 || 0)) }}%)", header: "(dont payant)", class: "subGroup" },
        { variable: "entreesLP", template: "{{ format('### ##0,#', entreesLP) }} ({{ format('### ##0,0', (entreesLP / entrees * 100 || 0)) }}%)", header: "(dont Libre pass)", class: "subGroup" },
        { variable: "entreesGratuit", template: "{{ format('### ##0,#', entreesGratuit) }} ({{ format('### ##0,0', (entreesGratuit / entrees * 100 || 0)) }}%)", header: "(dont gratuit)", class: "subGroup" },
        { variable: "web", template: "{{ format('### ##0,#', web) }} ({{ format('### ##0,0', (web / entrees * 100 || 0)) }}%)", header: "Ventes web (entrées)" },
        { variable: "recette", template: "{{ format('### ##0,00', recette) }} €", header: "Recette" },
        { variable: "moyEntreesSeance", template: "{{ format('### ##0,0', moyEntreesSeance || 0) }}", header: "Moyenne : entrées par séance" },
        { variable: "moyRecetteSeance", template: "{{ format('### ##0,00', moyRecetteSeance || 0) }} €", header: "Moyenne : recette par séance" },
        { variable: "moyRecetteEntree", template: "{{ format('### ##0,00', moyRecetteEntree || 0) }} €", header: "Moyenne : recette par entrée" },
        { variable: "moyRecetteEntreePayant", template: "{{ format('### ##0,00', moyRecetteEntreePayant || 0) }} €", header: "Moy : recette / entrée payante" },
        { variable: "tauxRemplissage", template: "{{ format('### ##0,0',tauxRemplissage * 100) }}%", header: "Taux de remplissage" }
      ]
   };

    $(container)
      .html(temp({ table: _.assign(tableLayout, { week: (function () { var w = formatWeek(week); return "Semaine du<br>" + w[0] + " au " + w[1]; })(), data: data[week] })}))
      .on("click", "td", function (e) {
        $.publish("summaryCell.click", e);
      });
  }


  function on(event, callback) {
    $.subscribe(event, callback);
  }


  return {
    on: on,
    render: render
  };
})();