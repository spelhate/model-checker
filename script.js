var templates = {};

var _data;

var parseWKT = function (wkt) {
    var lonlat = [0, 0];
    // find data beetween ()
    //var regExp = /\(([^)]+)\)/;
    // regex get all numeric values
    var a = /[-+]?\d+(?:\.\d*)?/gi
    if (wkt.match(a)) {
        lonlat = wkt.match(a).map(Number);
        console.log(lonlat);
    }
    return lonlat;
};


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
    //get all report-bloc and report-bloc-title + report-bloc-subtitle
    var blocs = []
    $(html).find("template.report-bloc").each(function (id, template) {
        var bloc = $(template).prop('content').firstElementChild;
       blocs.push(bloc);
    });
    var title;
    $(html).find("template.report-bloc-title").each(function (id, template) {
        title = $(template).prop('content').firstElementChild;
    });

    var subtitle;
      $(html).find("template.report-bloc-subtitle").each(function (id, template) {
          subtitle = $(template).prop('content').firstElementChild;
      });

    var dataviz_components = {};
    ["figure", "chart", "table", "title", "subtitle",  "text", "iframe", "image", "map"].forEach(function (component) {
        var element = $(html).find("template.report-component.report-" + component).prop('content').firstElementChild;
        dataviz_components[component] = $.trim(element.outerHTML);
    });


    var extra_elements = {};
    $(html).find("template.report-element").each(function (id, template) {
        var extra = $(template).prop('content').firstElementChild;
        if (extra.classList.contains("report-chart-summary")) {
            extra_elements["description"] = $.trim(extra.outerHTML);
        } else if (extra.classList.contains("report-chart-title")) {
            extra_elements["title"] = $.trim(extra.outerHTML);
        }

    });

    templates[id] = {
        id: id,
        parameters: parameters,
        style: style,
        page: page,
        title: title,
        subtitle: subtitle,
        blocs: blocs,
        dataviz_components: dataviz_components,
        extra_elements: extra_elements
    };

}


var _clear = function () {
    $("#palette span").remove();
    $("#view").html("");

}

var toggleContainers = function () {
    //var checked = document.getElementById("showContainers").checked;
    $(".bloc-content,.report-bloc-title,.report-bloc-subtitle,.dataviz-container").toggleClass("delimited");
}

var applyModel = function () {
    var model = document.querySelector("#selector").value;
    var dc = Date.parse(new Date());
    if (!templates[model]) {
        $.ajax({
            url: model + ".html?dc=" + dc,
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
    var container;
    if (type === "title") {
        container = $(".report-bloc-title .dataviz-container:not(.configured)").first();
    } else if(type === "subtitle"){
        container = $(".report-bloc-subtitle .dataviz-container:not(.configured)").first();
    } else  {
        //Get first "free" dataviz container if exists
        container = $(".report-bloc .dataviz-container:not(.configured)").first();
        if (container.length === 0) {
            //Insert new random dataviz container bloc if no exists
            let rnd = Math.floor(Math.random() * tpl.blocs.length);
            let nbloc = tpl.blocs[rnd];
            $(".container.report").append(nbloc.cloneNode(true));
            container = $(".report-bloc .dataviz-container:not(.configured)").first();
        }
    }
    if (type) {
        var dvz = tpl.dataviz_components[type].replace('{{dataviz}}', id);
        container.append(dvz);
    }
    container.addClass("configured");
}

var _load = function (tplId) {
    _clear();
    var tpl = templates[tplId];
    $("#view").append(tpl.style);
    $("#view").append(tpl.page);
    _loadColors(tpl.parameters.colors);
    $(".container.report").append(tpl.title);
    $(".container.report").append(tpl.subtitle);
    tpl.blocs.forEach(function(bloc) {
        $(".container.report").append(bloc.cloneNode(true));
    })
    // Set bloc description as text value
    document.querySelectorAll(".bloc-title").forEach(function(title) {
        if (title.parentElement.dataset["modelTitle"]) {
            title.textContent = "BLOC " + title.parentElement.dataset["modelTitle"];
        }

    });
    //Title
    _initDatavizContainer("titre-0", "title", tpl);
    $("#titre-0").text(_data.title);

    //subtitle
    _initDatavizContainer("sous-titre-0", "subtitle", tpl);
    $("#sous-titre-0").text(_data.subtitle);


    //free-text titre-n
    $("#free-text").html("");
    $("#free-text").append('<div class="titleBloc"><p>Free text (normal)</p></div>');
    [1,2,3,4].forEach(function (i) {
        $("#free-text").append(`<div class="titleBloc"><p class="titre-${i}">Free text (titre-${i})</p></div>`);
    });


    // chiffres clés
    var counter = 0;
    _data.figure.forEach(function(figure) {
        _initDatavizContainer(figure.id, "figure", tpl);
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
        _initDatavizContainer(image.id, "image", tpl);
        $("#" + image.id + " img").remove();
        $("#" + image.id).append('<img src="'+ image.data +'" class="img-fluid">');
    });

    //maps
    _data.map.forEach(function(map) {
        _initDatavizContainer(map.id, "map", tpl);
        $("#" + map.id).append(`<div id="${map.id}-map" style="width:auto;height:300px;"><div>`);
        var _map = L.map(map.id + "-map");
        _map.zoomControl.remove();
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(_map);
        let point = parseWKT(map.data).reverse();
        let icon = L.divIcon({
            className: 'map-marker-circle-1',
            iconSize: [30, 30]
        });
        var marker = L.marker(point, {
            icon: icon
        }).addTo(_map).bindPopup(map.label);
        _map.setView(point, 8);

    });


     // images
     _data.iframe.forEach(function(iframe) {
        _initDatavizContainer(iframe.id, "iframe", tpl);
        $("#" + iframe.id + " iframe").remove();
        $("#" + iframe.id).append('<iframe class="embed-responsive-item" src="' + iframe.data + '"></iframe>');
    });

    // textes
    _data.text.forEach(function(text) {
        _initDatavizContainer(text.id, "text", tpl);
        $("#" + text.id + " .report-text-title").text(text.label);
        $("#" + text.id + " .report-text-text").html(text.data);

    });

    // Empty bloc
        _initDatavizContainer(null, null, tpl);

    //tableau
    var tableau = '<table class="table table-bordered"><thead class="thead-light"><tr><th scope="col">Nom</th><th scope="col">Secteur</th></tr></thead><tbody><tr><td>LYCEE JEAN MACE</td><td>Public</td></tr><tr><td>LYCEE NOTRE DAME DE LA PAIX</td><td>Privé</td></tr><tr><td>LYCEE COLBERT</td><td>Public</td></tr><tr><td>LYCEE NOTRE DAME DU VOEU</td><td>Privé</td></tr><tr><td>LYCEE DUPUY DE LOME</td><td>Public</td></tr><tr><td>LYCEE VICTOR HUGO</td><td>Public</td></tr><tr><td>LP EMILE ZOLA</td><td>Public</td></tr></tbody></table>';
    var id = 'tableau-0';
    var tab = _initDatavizContainer(id, "table", tpl);
    //Hack duplicates dataviz
    $("#" + id + " table").remove();
    $("#" + id).append(tableau);

    //3 graphiques
    _data.chart.forEach(function(chart) {
        _initDatavizContainer(chart.id, "chart", tpl);
        //Hack duplicates dataviz
        $("#" + chart.id + " canvas").remove();
        //Add title and description
        if (chart.title) {
            $("#" + chart.id).parent().find(".report-dataviz-title").text(chart.title);
        } else {
            $("#" + chart.id).parent().find(".report-dataviz-title").text("");
        }
        if (chart.description) {
            $("#" + chart.id).parent().find(".report-dataviz-description").text(chart.description);
        } else {
            $("#" + chart.id).parent().find(".report-dataviz-description").text("");
        }

        //Add canvas
        let chart_width = 200;
        let chart_height = 200;
        if (chart.format) {
            let format = chart.format.split(":");
            let w = parseInt(format[0]);
            let h = parseInt(format[1]);
            chart_width = chart_width * w;
            chart_height = chart_height * h;
        }
        $("#" + chart.id).prepend(`<canvas id="${chart.id}-canvas" width="${chart_width}" height="${chart_height}"></canvas>`);
        var ctx = document.getElementById(chart.id + "-canvas").getContext('2d');
        var myChart = new Chart(ctx, {
          type: chart.type,
          data: {
            labels:chart.label,
            datasets: [{
              label: 'Légende',
              data: chart.data,
              backgroundColor: tpl.parameters.colors,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true
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
            // add model to selector
            _data.models.forEach(function(model) {
                $("#selector").append(`<option value="${model}">${model}</option>`);
            });
        },
        error: function (xhr, status, err) {
            alert("Erreur avec le fichier data.json " + err);
        }
    });
}

$( document ).ready(function() {
    _loadData();
});
