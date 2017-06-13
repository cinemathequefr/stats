// Construit un fichier public/data/cycles/cycle-{id}.json à partir de public/data/seances.json and public/data/cycle-seances.json
"use strict";

const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs")); // http://bluebirdjs.com/docs/api/promise.promisifyall.html
const _ = require("lodash");
var moment = require("moment");
var aggregateSeances = require("./modules/aggregateSeances");
var config = require("./modules/config.js");

var idCycle = parseInt(process.argv[2], 10);

var p = Promise
.map(
  [
    config.path.local + "seances.json",
    config.path.local + "static/cycle-seances.json",
    config.path.local + "static/cycles.json"
  ],
  filename => {
    return fs.readFileAsync(filename, "utf-8");
  }
);

p
.then(data => _(data).map(d => JSON.parse(d)).value())
.then(data => {
  var seances = data[0];
  var cycleSeances = data[1][idCycle];
  var cycles = data[2];


  var o = _(cycleSeances) // Extrait les items séances correspondant aux IDs de séance du cycle
    .map(id => _(seances).filter(s => s.idSeance === id).value()[0])
    .sortBy("date")
    .value();

  writeJSON(o, "cycles/" + idCycle + ".json");

  fs.readFile(config.path.local + "cycles/aggregate.json", function (err, data) {
    var p = {};
    var q = (err || !data) ? [] : JSON.parse(data);

    p[idCycle] = _({}) // Informations sur le cycle (titre, dates de début et fin, durée en jours)
      .assign(
        aggregateSeances(o),
        _(cycles).chain().find(c => c.idCycleSite === idCycle).pick(["title", "dateFrom", "dateTo"]).value()
      )
      .thru(c => _({}).assign(c, { "duration": moment(c.dateTo).diff(c.dateFrom, "days") + 1 }).value())
      .value();

    writeJSON(
      _(q)
        .omit(idCycle) // Nécessaire ? Retire l'entrée de la semaine correspondant à celle qui la remplacera
        .assign(p)
        .value(),
      "cycles/aggregate.json"
    );

  });

});

function writeJSON(data, name) {
  var json = JSON.stringify(data, null, 2);
  fs.writeFile(config.path.local + name, json, "utf8");
  fs.writeFile(config.path.remote + name, json, "utf8");
}