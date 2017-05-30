_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });

var id = getParameterByName("id") || 375;

var temp = _.template([
  "<p>{{ data.length }} séances.</p>",
  "<table>",
  "<tr>",
  "<th style='width: 10%;'>Date</th>",
  "<th style='width: 5%;'>Heure</th>",
  "<th style='width: 3%;'>Salle</th>",
  "<th style='width: 7%;'>Id</th>",
  "<th style='width: 35%;'>Titre</th>",
  "<th>Entrées</th>",
  "<th>(Payant)</th>",
  "<th>(LP)</th>",
  "<th>(Gratuit)</th>",
  "</tr>",
  "<% _.forEach(data, function (item) { %>",
  "<tr>",
  "<td class='center'>{{ moment(item.date).format('ddd D MMM YYYY') }}</td>",
  "<td class='center'>{{ moment(item.date).format('HH:mm') }}</td>",
  "<td class='center'>{{ item.salle.code }}</td>",
  "<td class='center'> {{ item.idSeance }}</td>",
  "<td>{{ item.titre }}</td>",
  "<td class='right'>{{ item.tickets.compte }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.payant }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.lp }}</td>",
  "<td class='right'>{{ item.tickets.tarifCat.gratuit }}</td>",
  "</tr>",
  "<% }); %>",
  "</table>"
].join(""));


$(function () {
  $.getJSON("../../data/cycles/" + id + ".json", function (data) {
    $("<div>").appendTo(".container").html(temp({ "data": data }));

    $("table").on("click", "tr", function () {
      $(this).toggleClass("hi");
    });


  });
});



function getParameterByName(name, url) { // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}