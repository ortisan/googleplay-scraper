var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sharp = require('sharp');
var app = express();

app.get('/app', function (req, res) {
    var id = req.query.id;

    if (!id) {
        res.status(404).send("Not found");
        return;
    }

    url = 'https://play.google.com/store/apps/details?id=' + id + '&hl=pt-BR';

    try {
        request(url, function (error, response, html) {

            if (!error) {
                var $ = cheerio.load(html);
                var title = $(".document-title").text();

                var rating = $(".score").text();
                var descricao = $(".show-more-content").text();
                var imgs = [];

                fs.writeFile('output.html', html, function (err) {
                });

                var urlIcone = $("img.cover-image").attr('src');
                var package = $('.details-wrapper').data('docid')
                var iconeLocal = package.replace(/\./gi, "_");

                download(urlIcone, iconeLocal + '.webp', function () {
                    sharp(iconeLocal + '.webp')
                        .toFile(iconeLocal + '.png', function (err) {
                            //console.error(err);
                        });
                });

                $(".thumbnails img.screenshot").each(function (i, element) {
                    var url = $(element).attr('src');
                    url = url.replace('https:', 'http:');

                    download(url, '' + i + '.webp', function () {
                        sharp('' + i + '.webp')
                            .toFile('' + i + '.png', function (err) {
                                //console.error(err);
                            });
                    });
                    imgs.push('' + i + '.png');
                });

                var json = {title: title, rating: rating, package: package, imgsDescricao: imgs};
                res.send(json);
            }

            fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
            });
        });
    } catch (exc) {
        res.status(505).send("Error: " + exc);
        return;
    }
});


app.listen('8081')

console.log('Listening on port 8081');

var download = function (uri, filename, callback) {
    request(uri, {method: 'head'}, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

exports = module.exports = app;