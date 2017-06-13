$(run);

function run() {
  "use strict";
  var $select = $("select");

  moment().locale("fr");
  table.init(document.querySelector("#seances"));
  timeChart.init(document.querySelector(".timeChart")); // TODO: move to summary (it's a subview thereof)

  timeChart.on("timeChartBar.click", function (e, f) {
    $select.val(f.week).change();
  });

  $.getJSON("data/weeks/aggregate.json", function (dataSummary) {
    var week;

    $select.on("change", function (e) {
      week = e.target.value;
      $.getJSON("data/weeks/" + week + ".json", function (dataSeances) {
        table.update(extendData(dataSeances));
        summary.render(document.querySelector("#summary"), dataSummary, week);
        timeChart.clear();
      });
    });

    $select.val($select.children("option:last").attr("value")).change(); // http://stackoverflow.com/questions/5760873/

    summary.on("summaryCell.click", function (e, f) {
      var cell = $(f.target).data("cell");

      console.log("cell", cell); // TEMP

      // VERY DIRTY HACK
      $(".summaryTable td").removeClass("active");
      $(f.target).addClass("active");

      timeChart.render(cell, dataSummary, week);
    });
  });
}


function extendData(data) { // Add computed fields (%) to the initial data
  return _(data).map(function (item, i) {
    return _({})
    .assign(item, {
      percent: {
        remplissage: ((item.tickets.compte / [null, 413, 186, 93][item.salle.id]) * 100).toFixed(1),
        payant: ((item.tickets.tarifCat.payant / item.tickets.compte) * 100).toFixed(1),
        lp: ((item.tickets.tarifCat.lp / item.tickets.compte) * 100).toFixed(1),
        gratuit: ((item.tickets.tarifCat.gratuit / item.tickets.compte) * 100).toFixed(1),
        web: ((item.tickets.web / item.tickets.compte) * 100).toFixed(1)
      }
    })
    .value();
  })
  .value();
}


function formatDateTime(d) {
  var o = new Date(d.replace(/^((19[0-9]{2}|2[0-9]{3})-(0[1-9]|1[012])-([123]0|[012][1-9]|31)) (([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]))$/, "$1T$5"));
  return [
    ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][o.getDay()],
    o.getDate(),
    ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"][o.getMonth()].toLowerCase(),
    (1900 + o.getYear()),
    o.getHours() + ":" + (o.getMinutes() + "0").substring(2, 0)
  ].join(" ");
}


function formatEuro(a) {
  var b = a.toFixed(2).match(/(\d+)(\.+(\d{1,2}|$))?/);
  return b[1] + (b[2] ? "," + (b[2][1] + "0").substring(0, 2) : "");
}


function weekToISODate(wk) { // Converts a "week" string (e.g. "2016-s25") to the ISO dates of the start and end days
  // var a = wk.match(/(\d{4})-s(\d{2})/);
  var a = wk.match(/(\d{4})-s(\d{1,2})/);
  var start = moment().year(a[1]).isoWeek(a[2]).startOf("isoWeek");
  return {
    start: start.format("YYYY-MM-DD"),
    end: start.clone().add(6, "d").format("YYYY-MM-DD")
  };
}

function formatWeek(wk, format) { // 
  format = (format === 0 ? 0 : 1); // 0-Short month names, 1-Long month names
  function monthName(m) {
    if (!m) return "";
    return [
      ["", "jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"],
      ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
    ][format][parseInt(m, 10)];
  }
  var inISODates = weekToISODate(wk);
  var inStartDate = moment(inISODates.start);
  var inEndDate = moment(inISODates.end);
  var outYears = (inStartDate.isSame(inEndDate, "year") ? ["", inEndDate.format("YYYY"), true] : [inStartDate.format("YYYY"), inEndDate.format("YYYY"), false]);
  var outMonths = (inStartDate.isSame(inEndDate, "month") && outYears[2] ? ["", inEndDate.format("M")] : [inStartDate.format("M"), inEndDate.format("M")]);
  var outDays = [inStartDate.format("D"), inEndDate.format("D")];
  return [(outDays[0] + " " + monthName(outMonths[0]) + " " + outYears[0]).trim(), (outDays[1] + " " + monthName(outMonths[1]) + " " + outYears[1]).trim()];
}


// datesStartEnd: function (dateStart, dateEnd) {
//   function monthName(m) {
//     if (!m) return "";
//     return ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][parseInt(m, 10)];
//   }
//   var outYears = (dateStart.isSame(dateEnd, "year") ? ["", dateEnd.format("YYYY"), true] : [dateStart.format("YYYY"), dateEnd.format("YYYY"), false]);
//   var outMonths = (dateStart.isSame(dateEnd, "month") && outYears[2] ? ["", dateEnd.format("M")] : [dateStart.format("M"), dateEnd.format("M")]);
//   var outDays = [dateStart.format("D"), dateEnd.format("D")];
//   return [(outDays[0] + " " + monthName(outMonths[0]) + " " + outYears[0]).trim(), (outDays[1] + " " + monthName(outMonths[1]) + " " + outYears[1]).trim()];
// }
