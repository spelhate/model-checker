var templates = {};

var _parseTemplate = function (html) {
    var id = $(html)[0].id;
    // get data- linked to the template
    var parameters = $(html).data(); /* eg data-colors... */
    if (parameters.colors) {
        parameters.colors = parameters.colors.split(",");
    }
    //get style
    var style = $(html).find("style")[0];
    if (style) {
        style = style.outerHTML;
    }
    //get main template div
    var page = $(html).find("template.report").get(0).content.firstElementChild.outerHTML;
    //get all report-bloc and report-bloc-title
    var blocs = []
    $(html).find("template.report-bloc").each(function (id, template) {
        var bloc = $(template).prop('content').firstElementChild;
       blocs.push(bloc);
    });

    var dataviz_components = {};
    ["figure", "chart", "table", "title", "text", "iframe", "image", "map"].forEach(function (component) {
        var element = $(html).find("template.report-component.report-" + component).prop('content').firstElementChild;
        dataviz_components[component] = $.trim(element.outerHTML);
    });

    templates[id] = {
        id: id,
        parameters: parameters,
        style: style,
        page: page,
        blocs: blocs,
        dataviz_components: dataviz_components
    };

}


var _clear = function () {
    $("#palette span").remove();
    $("#view")[0].innerHTML = "";

}

var applyModel = function () {
    _clear();
    var model = document.querySelector("#selector select").value;
    if (!templates[model]) {
        $.ajax({
            url: model + ".html",
            dataType: "text",
            success: function (html) {
                //Template parsing
                _parseTemplate(html);
                _load(model);

            },
            error: function (xhr, status, err) {
                alert("Erreur avec le fichier " +  model + ".html " + err);
            }
        });
    } else {
        _load(model);
    }


};


var _initDatavizContainer = function (id, type, tpl) {
    // Create in DOM dataviz element structure based on model dataviz components
    var dvz = tpl.dataviz_components[type].replace('{{dataviz}}', id);
    var container = $(".dataviz-container:not(.configured)").first();
    container.append(dvz);
    container.addClass("configured");
    return container;
}

var _load = function (tplId) {
    var tpl = templates[tplId];
    $("#view").append(tpl.style);
    $("#view").append(tpl.page);
    _loadColors(tpl.parameters.colors);
    tpl.blocs.forEach(function(bloc) {
        $(".container.report").append(bloc);
    })
    // 4 chiffres clés
    var counter = 0;
    [456789, 123, 7894, 17].forEach(function(v) {
        counter += 1;
        var desc = "Texte descriptif";
        var id = 'figure-' + counter;
        var container = _initDatavizContainer(id, "figure", tpl);
        $("#" + id).find(".report-figure-chiffre").text(v);
        $("#" + id).find(".report-figure-caption").text(desc);
        if (counter === 2) {
            $("#" + id).addClass("custom-icon-left");
        } else if (counter === 3) {
            $("#" + id).addClass("custom-icon-right");
        }
    });

    //1 image
    var id = 'image-0';
    var img = _initDatavizContainer(id, "image", tpl);
    $("#" + id).append('<img src="https://kartenn.region-bretagne.fr/img/vn/ecluse/ECL_V02.jpg" class="img-fluid">');
    //tableau


    var tableau = '<table class="table table-bordered"><thead class="thead-light"><tr><th scope="col">Nom</th><th scope="col">Secteur</th></tr></thead><tbody><tr><td>LYCEE JEAN MACE</td><td>Public</td></tr><tr><td>LYCEE NOTRE DAME DE LA PAIX</td><td>Privé</td></tr><tr><td>LYCEE COLBERT</td><td>Public</td></tr><tr><td>LYCEE NOTRE DAME DU VOEU</td><td>Privé</td></tr><tr><td>LYCEE DUPUY DE LOME</td><td>Public</td></tr><tr><td>LYCEE VICTOR HUGO</td><td>Public</td></tr><tr><td>LP EMILE ZOLA</td><td>Public</td></tr></tbody></table>';

    var id = 'tableau-0';
    var tab = _initDatavizContainer(id, "table", tpl);
    $("#" + id).append(tableau);

    //3 graphiques

    const data = [12, 19, 3, 5, 2, 3, 20, 3, 5, 6, 2, 1] ;
    ["a","b", "c"].forEach(function(l) {
        var id = 'chart-' + l;
        var dvz = _initDatavizContainer(id, "chart", tpl);
        $("#" + id).prepend('<canvas id="' + id + '-canvas" width="400" height="200"></canvas>');
        var ctx = document.getElementById(id + "-canvas").getContext('2d');
        var myChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ["2015-01", "2015-02", "2015-03", "2015-04", "2015-05", "2015-06", "2015-07", "2015-08", "2015-09", "2015-10", "2015-11", "2015-12"],
            datasets: [{
              label: '# of Tomatoes',
              data: data.sort(() => Math.random() - 0.5),
              backgroundColor: tpl.parameters.colors,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              xAxes: [{
                ticks: {
                  maxRotation: 90,
                  minRotation: 80
                }
              }],
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            }
          }
        });
    });





};




var _loadColors = function (colors) {
var palette = [];
    colors.forEach(function(color) {
        palette.push('<span class="pal-color" style="background-color: ' + color + ';">' + color + '</span>');
    });
    $("#palette").append(palette.join(""));

};

