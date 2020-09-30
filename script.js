var templates = {};

var _data;

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
    $("#view").html("");

}

var toggleContainers = function () {
    //var checked = document.getElementById("showContainers").checked;
    $(".bloc-content,.dataviz-container").toggleClass("delimited");
}

var applyModel = function () {
    var model = document.querySelector("#selector").value;
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
    _clear();
    var tpl = templates[tplId];
    $("#view").append(tpl.style);
    $("#view").append(tpl.page);
    _loadColors(tpl.parameters.colors);
    tpl.blocs.forEach(function(bloc) {
        $(".container.report").append(bloc);
    })
    // chiffres clés
    var counter = 0;
    _data.figure.forEach(function(figure) {
        var container = _initDatavizContainer(figure.id, "figure", tpl);
        $("#" + figure.id).find(".report-figure-chiffre").text(figure.data);
        $("#" + figure.id).find(".report-figure-caption").text(figure.label);
        if (figure.iconposition === "left") {
            $("#" + figure.id).addClass("custom-icon-left");
        } else if (figure.iconposition === "right") {
            $("#" + figure.id).addClass("custom-icon-right");
        }
    });

    // images
    _data.image.forEach(function(image) {
        var img = _initDatavizContainer(image.id, "image", tpl);
        $("#" + image.id + " img").remove();
        $("#" + image.id).append('<img src="'+ image.data +'" class="img-fluid">');
    });

    //tableau
    var tableau = '<table class="table table-bordered"><thead class="thead-light"><tr><th scope="col">Nom</th><th scope="col">Secteur</th></tr></thead><tbody><tr><td>LYCEE JEAN MACE</td><td>Public</td></tr><tr><td>LYCEE NOTRE DAME DE LA PAIX</td><td>Privé</td></tr><tr><td>LYCEE COLBERT</td><td>Public</td></tr><tr><td>LYCEE NOTRE DAME DU VOEU</td><td>Privé</td></tr><tr><td>LYCEE DUPUY DE LOME</td><td>Public</td></tr><tr><td>LYCEE VICTOR HUGO</td><td>Public</td></tr><tr><td>LP EMILE ZOLA</td><td>Public</td></tr></tbody></table>';
    var id = 'tableau-0';
    var tab = _initDatavizContainer(id, "table", tpl);
    //Hack duplicates dataviz
    $("#" + id + " table").remove();
    $("#" + id).append(tableau);

    //3 graphiques
    _data.chart.forEach(function(chart) {
        var dvz = _initDatavizContainer(chart.id, "chart", tpl);
        //Hack duplicates dataviz
        $("#" + chart.id + " canvas").remove();
        $("#" + chart.id).prepend('<canvas id="' + chart.id + '-canvas" width="400" height="200"></canvas>');
        var ctx = document.getElementById(chart.id + "-canvas").getContext('2d');
        var myChart = new Chart(ctx, {
          type: chart.type,
          data: {
            labels:chart.label,
            datasets: [{
              label: '# dataset',
              data: chart.data,
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

var _loadData = function () {
    $.ajax({
        url: "data.json",
        dataType: "json",
        success: function (data) {
            _data = data;
        },
        error: function (xhr, status, err) {
            alert("Erreur avec le fichier data.json " + err);
        }
    });
}

$( document ).ready(function() {
    _loadData();
});
