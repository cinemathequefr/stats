var timeChart = (function () {
  var $elem;
  var width;
  var height;
  var margin = { top: 10, right: 10, bottom: 10, left: 0 };
  var svg;
  var tip;
  var axis;
  var x;
  var y;
  var elAxis;

  function init (elem) {
    $elem = $(elem);
    $elem.css({ padding: 0 });
    width = 1050 - margin.left - margin.right;
    height = 250 - margin.top - margin.bottom;

    x = d3.scale.ordinal().rangeRoundBands([0, (width - 50)], 0.1); // TEST: offset by 50
    y = d3.scale.linear().range([height, 0]); // TEST : offset by 30

    svg = d3.select(elem)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    axis = d3.svg.axis()
      .scale(y)
      .ticks(5)
      .tickSize(-width)
      .orient("left");

    tip = d3.tip() // Tooltip for D3: http://labratrevenge.com/d3-tip/
      .offset([-2, 0])
      .attr("class", "d3-tip");

    svg
      .append("g")
      .attr("transform", "translate(50, 0)")
      .attr("class", "y axis");
  }


  function clear () {
    tip.hide();
    render(null, []);
  }


  function render (cell, data, week) {
    var bar;

    // Computes max value of the vertical range (TODO: deal with %-variables, where max=100)
    var maxY = _(data)
      .map(function (v) { return _.map(v, function (w) { return w; }); }) // TODO: Improve
      .flatten()
      .map(function (v) { return v[cell.variable]; })
      .max();

    data = _(_.keys(data))
    .zipWith(_.values(data), function (week, d) {
      return _.defaults({ week: week }, d);
    })
    .sortBy(function (item) {
      var yearMonth = item.week.match(/^(\d{4})-s(\d{1,2})/);
      var m = moment().year(yearMonth[1]).isoWeek(yearMonth[2]).toDate();
      return m;
    })
    .value();

    x.domain(data.map(function(d, i) { return i; }));
    y.domain([0, (maxY * 1.2) ]);

    var header = svg.selectAll("text.header").data([cell]);

    tip.html(function (d) {
      return [
        "<span class='d3-tip-label'>Semaine du<br>" + (function () { var dates = formatWeek(d.week, 0); return dates[0] + "-" + dates[1]; })() + "</span><br>",
        "<span class='d3-tip-value'>" + _.template(cell.template)(d[cell.salle]) + "</span>"
      ].join("");
    });

    svg.call(tip);
    svg.select(".y.axis").call(axis);

    header
      .text(function (d) {
        if (!d) return;
        return [
          "Comparaison hebdomadaire : ",
          {
            seances: "Nombre de séances", 
            entrees: "Nombre d'entrées", 
            entreesPayant: "Nombre d'entrées payantes",
            entreesLP: "Nombre d'entrées Libre pass",
            entreesGratuit: "Nombre d'entrées gratuites",
            web: "Nombre de ventes web (entrées)", 
            recette: "Recette", 
            moyEntreesSeance: "Nombre moyen d'entrées par séance",
            moyRecetteSeance: "Recette moyenne par séance",
            moyRecetteEntree: "Recette moyenne par entrée",
            tauxRemplissage: "Taux de remplissage"
          }[d.variable],
          { "1": " Salle HL", "2": " Salle GF", "3": " Salle JE", global: " Toutes salles" }[d.salle]
        ].join("");
      });

    header.enter()
      .append("text")
      .attr({ class: "header", x: 4, y: 4 })
      .text("");

    bar = svg.selectAll(".bar").data(data);

    bar.enter()
      .append("rect")
      .classed("bar", true)
      .attr("x", function (d, i) {
        return x(i) + 50; // Test: offset by 50
      })
      .attr("y", height)
      .attr("width", x.rangeBand())
      .attr("height", 0);

    bar
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide)

      .classed("current", false)
      .on("click", function (d) { $.publish("timeChartBar.click", d); })
      .filter(function (d) {
        return d.week === week;
      })
      .classed("current", true);

    bar
      .transition()
      .duration(250)
      .attr("y", function (d) {
        return y(d[cell.salle][cell.variable]);
      })
      .attr("height", function(d) {
        return height - y(d[cell.salle][cell.variable]);
      });

    bar
      .exit()
      .remove();
  }


  function on(event, callback) {
    $.subscribe(event, callback);
  }


  return {
    clear: clear,
    init: init,
    on: on,
    render: render
  };
})();