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


    request(url, function (error, response, html) {

        if (!error) {
            try {
                var $ = cheerio.load(html);
                var title = $(".document-title").text();
                if (title == '') {
                    throw 404;
                }

                var rating = ($(".score").text()).replace(",", ".");
                var descricao = $(".show-more-content").text();
                var imgs = [];

                /*fs.writeFile('output.html', html, function (err) {
                 });*/

                var urlIcone = $("img.cover-image").attr('src');
                var package = $('.details-wrapper').data('docid')
                var prefixoImgs = package.replace(/\./gi, "_");

                download(urlIcone, prefixoImgs + '.webp', function () {
                    sharp(prefixoImgs + '.webp')
                        .toFile(prefixoImgs + "_icon" + '.png', function (err) {
                            //console.error(err);
                        });
                });

                $(".thumbnails img.screenshot").each(function (i, element) {
                    var url = $(element).attr('src');
                    url = url.replace('https:', 'http:');

                    download(url, '' + i + '.webp', function () {
                        sharp('' + i + '.webp')
                            .toFile(prefixoImgs + '_dsc_' + i + '.png', function (err) {
                                //console.error(err);
                            });
                    });
                    imgs.push(prefixoImgs + '_dsc_' + i + '.png');
                });

                var json = {
                    url: this.href,
                    title: title,
                    rating: rating,
                    package: package,
                    img: prefixoImgs + '.png',
                    description: descricao,
                    imgsDescription: imgs
                };
                res.send(json);
            } catch (exc) {
                var statusCode = 505;
                if (!isNaN(exc)) {
                    statusCode = exc;
                }
                res.status(statusCode).send("Error: " + exc);
                return;
            }
        }
    });
});


app.listen('8081')

console.log('Listening on port 8081');

var download = function (uri, filename, callback) {
    request(uri, {method: 'head'}, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

exports = module.exports = app;