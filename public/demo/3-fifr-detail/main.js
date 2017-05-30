_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });

var temp = _.template([
  "<table>",
  "<tr>",
  "<th style='width: 10%;'>Date</th>",
  "<th style='width: 3%;'>Salle</th>",
  "<th style='width: 35%;'>Titre</th>",
  "<th>Entrées</th>",
  "<th>(Plein)</th>",
  "<th>(Réduit)</th>",
  "<th>(LP payant)</th>",
  "<th>(LP)</th>",
  "<th>(Gratuit)</th>",
  "<th>Ratio</th>",
  "</tr>",

  "<% _.forEach(data, function (item) { %>",
  "<tr>",
  "<td rowspan='2' class='center'>{{ moment(item.date).format('ddd D MMM YYYY') }}</td>",
  "<td rowspan='2' class='center'>{{ item.salle.code }}</td>",
  "<td rowspan='2'>{{ item.titre }}</td>",
  "<td class='right'>{{ item.tickets.compte }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.plein }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.reduit }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.lpPayant }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.lpGratuit }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.gratuit }}</td>",
  "<td rowspan='2' class='center'>{{ format('#,#0 %', (item.tickets.nonScannesCompte / item.tickets.compte) * 100) }}</td>",
  "</tr>",
  "<tr style='background-color: #eee; color: #f66;'>",
  "<td class='right'>{{ item.tickets.nonScannesCompte }}</td>",
  "<td class='right'>{{ item.tickets.nonScannes.plein }}</td>",
  "<td class='right'>{{ item.tickets.nonScannes.reduit }}</td>",
  "<td class='right'>{{ item.tickets.nonScannes.lpPayant }}</td>",
  "<td class='right'>{{ item.tickets.nonScannes.lpGratuit }}</td>",
  "<td class='right'>{{ item.tickets.nonScannes.gratuit }}</td>",
  "</tr>",
  "<% }); %>",
  "</table>",
  "<p>./</p>"
].join(""));


$(function () {

  $.getJSON("fifr2017.json", function (data) {
    $("<div>").appendTo(".container").html(temp({ "data": _(data).sortBy(function (item) { return item.tickets.nonScannesCompte / item.tickets.compte; }).reverse().value() }));
  });

});

