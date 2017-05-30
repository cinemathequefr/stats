var table = (function() {
  "use strict";

  var d3TBody;
  var capacityUnitPx;
  var container;
  var sortKey;
  var sortOrder = "asc";
  var duration = 500;

  var data;

  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g; // Set mustache-style interpolate delimiters

  function init(_container) {
    container = _container;

    d3TBody = d3
      .select(container)
      .append("table")
      .attr("class", "stats")
      .html("<colgroup><col/><col/><col/><col/><col/></colgroup><thead><tr><th>Date</th><th>Salle</th><th>Id</th><th>Titre</th><th>Fréquentation</th></tr></thead>")
      // .html("<colgroup><col/><col/><col/><col/></colgroup><thead><tr><th>Date</th><th>Salle</th><th>Titre</th><th>Fréquentation</th></tr></thead>")
      .append("tbody")
      .call(function() {
        capacityUnitPx = (($("col:nth-child(5)").width() - 100) / 413);
        if (capacityUnitPx < 0) capacityUnitPx = 1; // Dirty fix of Chrome bug (col width is zero)
      });

    // Sort (TODO: improve)
    d3.select(container).selectAll("thead th").on("click", function (d, col) {
      var sort = [
        function (data, order) { return _.orderBy(data, function (d) { return d.date; }, order); },
        function (data, order) { return _.orderBy(data, function (d) { return d.salle.id; }, order); },
        function (data, order) { return _.orderBy(data, function (d) { return d.idSeance; }, order); },
        function (data, order) { return _.orderBy(data, function (d) { return d.titre; }, order); },
        function (data, order) { return _.orderBy(data, function (d) { return d.tickets.compte; }, order); },
      ];
      data = sort[col](data, sortOrder); // Important: data must be mutated
      update(data);
      sortOrder = (sortOrder === "desc" ? "asc" : "desc");
    });
  }


  function update(_data) {
    // Note: when _data is passed, we consider it is a new data set (not simply a reordering of existing data).
    // Otherwise, we update the table using the mutated `data` variable.
    data = (_data ? _.cloneDeep(_data) : data);

    // Update
    d3TBody.selectAll("tr").data(data)
      .selectAll("td")
      .data(function (d) { return [d, d, d, d, d]; })
      .each(function (d, i) {
    
        [
          function(elem, d) { elem.html(formatDateTime(d.date)); },
          function(elem, d) { elem.html(d.salle.code); }, // Salle
          function(elem, d) { elem.html(d.idSeance); },
          function(elem, d) { elem.html(d.titre); },
          function(elem, d) {
            elem.selectAll(".jauge")
            .transition().duration(duration)
            .style({
              width: ([null, 413, 186, 93][d.salle.id] * capacityUnitPx) + "px"
            });

            elem.selectAll(".compteBar")
            .classed("exclude", !!d.exclude)
            .attr("title", _.template("(Id: {{ idSeance }})\nRemplissage : {{ percent.remplissage }}%\nRecette : {{ tickets.recette }} €\nPayant : {{ tickets.tarifCat.payant }} ({{ percent.payant }}%)\nLibre pass : {{ tickets.tarifCat.lp }} ({{ percent.lp }}%)\nGratuit : {{ tickets.tarifCat.gratuit }} ({{ percent.gratuit }}%)\nVentes web: {{ tickets.web }} ({{ percent.web }}%)")(d))
            .transition().duration(duration)
            .style({
              width: (d.tickets.compte * capacityUnitPx) + "px"
            });

            elem.selectAll(".recetteBar")
            .transition().duration(duration)
            .style({
              width: (d.tickets.recette / 7) + "px"
            });

            elem.selectAll(".compteNb")
            .classed("exclude", !!d.exclude)
            .text(d.tickets.compte);

          }
        ][i](d3.select(this), d);
      });

    // Enter
    d3TBody.selectAll("tr").data(data).enter()
      .append("tr")
      .selectAll("td")
      .data(function (item) { return [item, item, item, item, item]; })
      .enter()
      .append("td")
      .each(function (d, i) {
        [
          function(elem, d) { elem.attr("data-sort", d.date).html(formatDateTime(d.date)); }, // Date
          function(elem, d) { elem.attr("data-sort", d.salle.id).html(d.salle.code); }, // Salle
          function(elem, d) { elem.html(d.idSeance); }, // IdSeance
          function(elem, d) { elem.html(d.titre); }, // Titre
          function(elem, d) { // Fréquentation
            var cont;
            elem.attr("data-sort", d.tickets.compte);
            cont = elem.append("div").attr("class", "barContainer");

            cont
              .append("div")
              .attr("class", "jauge")
              .style({
                width: ([null, 413, 186, 93][d.salle.id] * capacityUnitPx) + "px"
              });

            cont
              .append("div")
              .attr("class", "compteBar")
              .classed("exclude", !!d.exclude)
              .attr("title", _.template("(Id: {{ idSeance }})\nRemplissage : {{ percent.remplissage }}%\nRecette : {{ tickets.recette }} €\nPayant : {{ tickets.tarifCat.payant }} ({{ percent.payant }}%)\nLibre pass : {{ tickets.tarifCat.lp }} ({{ percent.lp }}%)\nGratuit : {{ tickets.tarifCat.gratuit }} ({{ percent.gratuit }}%)\nVentes web: {{ tickets.web }} ({{ percent.web }}%)")(d))
              .transition()
              .duration(duration)
              .style({
                width: (d.tickets.compte * capacityUnitPx) + "px"
              });

            cont
              .append("div")
              .attr("class", "recetteBar")
              .transition()
              .duration(duration)
              .style({
                width: (d.tickets.recette / 7) + "px"
              });

            cont
              .append("div")
              .attr("class", "compteNb")
              .classed("exclude", !!d.exclude)
              .text(d.tickets.compte);
          }
        ][i](d3.select(this), d);
      });

    // TODO: avoid repetition using an enter+update scenario here? (see https://bl.ocks.org/mbostock/3808218)
    
    // Exit
    d3TBody.selectAll("tr").data(data).exit()
      .remove("tr");
  }


  return {
    init: init,
    update: update
  };
})();
