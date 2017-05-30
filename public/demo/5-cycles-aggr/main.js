_.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters
moment.locale("fr", { monthsShort: "jan_fév_mar_avr_mai_juin_juil_aoû_sep_oct_nov_déc".split("_"), weekdaysShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_") });


var temp = _.template([
  "<table>",
  "<tr>",
  "<th>Cycle</th>",
  "</tr>",
  "<% _.forEach(data, function (item) { %>",
  "<tr>",
  "<td>{{ data.title }}</td>",
  "</tr>",
  "<% }); %>",
  "</table>"
].join(""));


$(function () {
  $.getJSON("../../data/cycles/aggregate.json", function (data) {

    var o = _(data).sortBy("dateFrom")



    $("<div>").appendTo(".container").html(temp({ "data": data }));
  });
});
