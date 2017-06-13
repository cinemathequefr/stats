// - Reads the raw csv file given in parameter
// - Encodes it as utf-8
// - Converts it to JSON
// - Aggregates it by show + save (locally + on Constellation2)
// - Aggregates by week and updates aggregate.json (locally + on Constellation2)

var fs = require("fs");
var Converter = require("csvtojson").Converter; // https://github.com/Keyang/node-csvtojson
var _ = require("lodash");
var iconv = require("iconv-lite");
var AutoDetectDecoderStream = require("autodetect-decoder-stream");
var toString = require("stream-to-string");
var aggregateSeances = require("./modules/aggregateSeances");
var config = require("./modules/config.js");

var weekName = process.argv[2];

var stream = fs
.createReadStream("./data/" + weekName + ".csv")
.pipe(new AutoDetectDecoderStream({ defaultEncoding: "win1252" }))
.pipe(iconv.encodeStream("utf8"))
.pipe(new Converter({
  delimiter: ";",
  toArrayString: true,
  headers: ["idCanal", "idManif", "titre", "idSeance", "date", "idSalle", "montant", "tarif"]
}));


// Does the following with a raw weekly JSON data stream:
// - Aggregates the ticket entries to show (seances) entries
// - Looks up show exclusion list and mark accordingly
// - Saves the output as a weekly JSON file
// - Appends the output to a global JSON file (seances.json) (TODO)
// - Performs a second aggregation (show entries to week entries)
// - Saves the output as a global JSON file (aggregate.json)
// NOTE 2017-03-31: shows marked as excluded are removed from the computations for weekly aggregates (aggregate.json) -- they can't be reintegrated in the views

toString(stream).then(function (data) {
  var o = aggregateToSeance(JSON.parse(data));

  fs.readFile(config.path.local + "static/exclude-seances.json", function (err, excludeSeances) { // TODO: use promise (with Bluebird promisify, see: http://stackoverflow.com/questions/34628305/using-promises-with-fs-readfile-in-a-loop)

    // Add `exclude: true` if seanceId is in exclusion list
    excludeSeances = JSON.parse(excludeSeances);

    o = _(o).map(item => {
      return (
        _(excludeSeances).indexOf(item.idSeance) > -1
      ?
        _(item).assign({ exclude: true }).value()
      :
        item
      );
    })
    .value();


    // Weekly séances JSON file (eg. 2017-s1.json)
    writeJSON(o, "weeks/" + weekName + ".json");


    // Global séances JSON file (seances.json)
    fs.readFile(config.path.local + "seances.json", function (err, data) {
      var q = (err || !data) ? [] : JSON.parse(data);
      writeJSON(
        _(q)
          .concat(o)
          .groupBy("idSeance")
          .map(_.last)
          .sortBy("date")
          .value(),
        "seances.json"
      );
    });

    // Global aggregation by week (aggregate.json)
    fs.readFile(config.path.local + "weeks/aggregate.json", function (err, data) {
      var p = {};
      var q = (err || !data) ? [] : JSON.parse(data);

      p[weekName] = aggregateSeances(o);

      writeJSON(
        _(q)
          .omit(weekName) // Nécessaire ? Retire l'entrée de la semaine correspondant à celle qui la remplacera
          .assign(p)
          .value(),
        "weeks/aggregate.json"
      );
    });

  });
});


function writeJSON(data, name) {
  var json = JSON.stringify(data, null, 2);

  fs.writeFile(
    config.path.local + name,
    json,
    "utf8"
  );

  fs.writeFile(
    config.path.remote + name,
    json,
    "utf8"
  );
}


// Agrégation des tickets en séances
function aggregateToSeance(data) {
  return _(data)
  .map(function (item) {
    return _.assign({}, item, { montant: parseFloat((item.montant || "0").replace(",", ".")) }); // TODO: move this out of aggregate, make it part of a preprocess function
  })
  .groupBy("idSeance")
  .map(function (items) {
    return {
      idSeance: items[0].idSeance,
      idManif: items[0].idManif,
      titre: items[0].titre,
      date: items[0].date,
      salle: {
        "10551": { id: 1, code: "HL" },
        "10789": { id: 2, code: "GF" },
        "10783": { id: 3, code: "JE" }
      }[items[0].idSalle],
      tickets: {
        compte: items.length,
        recette: _.sumBy(items, item => item.montant),
        tarif: _(items).groupBy("tarif").mapValues(item => item.length).value(),
        tarifCat: _(items).reduce(function (acc, item) {
          return _({}).assign(acc, (function (item) {
            if (_.indexOf(config.codesTarifsLp, item.tarif) > -1) return { lp: acc.lp + 1 }; // Codes tarifaires Libre Pass
            if (item.montant == 0) return { gratuit: acc.gratuit + 1 };
            return { payant: acc.payant + 1 };
          })(item))
          .value()
        }, { payant: 0, lp: 0, gratuit: 0 }),
        web: _(items).filter(function (item) { return _.indexOf(config.codesTarifsWeb, item.idCanal) > -1; }).value().length // Codes canal de vente web
      }
    };
  })
  .filter(function (d) { return !_.isUndefined(d.salle); }) // Retire les items hors salle de cinéma
  .sortBy("date")
  .value();
}
