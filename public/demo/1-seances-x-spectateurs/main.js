// Data représente, pour chaque valeur de fréquentation, le décompte des séances. Par exemple, {"14":3} indique 3 séances à 14 spectateurs.
// NB : agrégation effectuée à partir des données du 21 septembre 2016 au 3 janvier 2017



d3.json("../../data/seances.json", function (data) {


  // data = _(data)
  // .groupBy(function (d) {
  //   return d.salle.id;
  // })
  // .mapValues(function (d) {
  //   return _(d).countBy(function (dd) {
  //     return dd.tickets.compte;
  //   })
  //   .value();
  // })
  // .value();
  data = _(data)
  .groupBy("salle.id")
  .mapValues(function (d) {
    return _(d).countBy("tickets.compte").value();
  })
  .value();

  console.log(data);

  var capacity = { "1": 413, "2": 186, "3": 93 };
  var idSalle = 3;

  // data = {"1":2,"2":2,"3":1,"4":1,"5":2,"6":2,"7":1,"8":1,"9":1,"11":4,"12":4,"13":1,"14":3,"15":3,"16":4,"17":5,"19":1,"20":7,"21":7,"22":3,"24":11,"25":5,"26":8,"27":8,"28":6,"29":6,"30":8,"31":12,"32":5,"33":10,"34":9,"35":11,"36":9,"37":15,"38":20,"39":15,"40":16,"41":13,"42":25,"43":12,"44":15,"45":20,"46":26,"47":12,"48":11,"49":26,"50":25,"51":15,"52":20,"53":19,"54":29,"55":15,"56":29,"57":15,"58":23,"59":19,"60":25,"61":14,"62":12,"63":25,"64":22,"65":21,"66":26,"67":23,"68":19,"69":17,"70":23,"71":22,"72":21,"73":16,"74":13,"75":31,"76":21,"77":16,"78":20,"79":17,"80":13,"81":19,"82":17,"83":22,"84":22,"85":22,"86":21,"87":18,"88":15,"89":20,"90":13,"91":14,"92":20,"93":35,"94":15,"95":14,"96":17,"97":12,"98":21,"99":14,"100":15,"101":15,"102":16,"103":8,"104":16,"105":14,"106":15,"107":12,"108":17,"109":8,"110":11,"111":18,"112":9,"113":14,"114":17,"115":11,"116":16,"117":9,"118":15,"119":14,"120":11,"121":12,"122":11,"123":9,"124":8,"125":14,"126":11,"127":9,"128":5,"129":5,"130":12,"131":10,"132":11,"133":8,"134":7,"135":16,"136":12,"137":13,"138":9,"139":9,"140":13,"141":6,"142":7,"143":15,"144":9,"145":7,"146":13,"147":8,"148":6,"149":7,"150":4,"151":9,"152":9,"153":5,"154":4,"155":7,"156":6,"157":8,"158":3,"159":5,"160":4,"161":10,"162":8,"163":10,"164":4,"165":1,"166":4,"167":12,"168":3,"169":6,"170":5,"171":11,"172":1,"173":5,"174":4,"175":2,"176":7,"177":6,"178":6,"179":5,"180":5,"181":6,"182":6,"183":3,"184":10,"185":4,"186":31,"187":2,"188":3,"189":2,"190":5,"191":3,"192":2,"193":3,"194":6,"195":3,"196":4,"197":2,"198":1,"199":3,"200":5,"201":6,"203":2,"204":2,"205":3,"206":2,"207":1,"208":1,"209":2,"210":4,"211":3,"213":3,"214":2,"215":4,"216":2,"217":1,"219":2,"221":5,"222":3,"223":2,"226":5,"227":2,"230":3,"231":1,"232":2,"233":2,"234":2,"235":2,"236":1,"237":2,"241":1,"244":1,"245":2,"246":2,"247":3,"248":3,"249":2,"250":2,"251":1,"253":1,"258":1,"259":1,"260":1,"261":1,"263":3,"264":1,"265":3,"266":2,"267":1,"268":1,"271":2,"273":1,"274":3,"275":2,"277":2,"278":1,"280":3,"281":1,"283":4,"285":3,"286":2,"291":2,"293":1,"302":1,"304":1,"305":1,"306":1,"307":2,"308":1,"309":3,"310":1,"313":1,"318":1,"319":2,"321":2,"322":1,"327":1,"329":2,"333":1,"336":2,"340":1,"341":1,"342":1,"347":1,"348":1,"350":1,"356":1,"357":2,"360":1,"362":1,"367":2,"368":1,"372":1,"374":1,"379":2,"380":1,"384":1,"386":2,"388":1,"391":4,"394":1,"398":1,"399":1,"400":1,"401":1,"402":2,"404":2,"405":2,"406":2,"407":1,"408":2,"409":2,"410":4,"411":2,"412":13,"413":8}

  // Remplit un tableau avec à chaque index la valeur lue dans data, ou 0 en son absence.
  // var o = _(Array(414))
  var o = _(Array(capacity[idSalle] + 1))
    .map((v, k) => {
      return {
        x: k,
        // y: data[idSalle][k] || 0
        y: (data[idSalle][k] || 0) * k, // Nombre d'entrées correspondantes
        s: (data[idSalle][k] || 0) // Nombre de séances
        // y: data[k] || 0
      }
    })
    .value();

  var margin = {top: 20, right: 10, bottom: 20, left: 10};
  var width = 960 - margin.left - margin.right; 
  var height = 500 - margin.top - margin.bottom;

  // Fonctions de mise à l'échelle
  var x = d3.scaleBand().rangeRound([0, width]).domain(_(o).map("x").value()).padding(0.1);
  var y = d3.scaleLinear().rangeRound([0, height]).domain([0, d3.max(o, function (d) { return d.y; })]);

  var tip = d3.tip()
  .attr("class", "d3-tip")
  .html(function (d) { return d.s + " séances avec " + d.x + " spectateurs" });

  var svg = d3.select("body").append("svg") // Conventional margins: https://bl.ocks.org/mbostock/3019563
  .call(tip)
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var barg = svg.selectAll("g").data(o).enter().append("g");

  barg
  .on("mouseover", tip.show)
  .on("mouseout", tip.hide);

  barg.append("rect")
  .classed("trans", true)
  .attr("x", function (d) {
    return x(d.x);
  })
  .attr("y", 0)
  .attr("width", x.bandwidth())
  .attr("height", height);

  barg
  .append("rect")
  .classed("bar", true)
  .attr("x", function (d) {
    return x(d.x);
  })
  .attr("y", function (d) {
    return height - y(d.y);
  })
  .attr("width", x.bandwidth())
  .attr("height", function (d) {
    return y(d.y);
  });




});





