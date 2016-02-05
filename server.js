var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var sharp = require('sharp');
var app = express();
var exec = require('child_process').exec,
    child;
var props = require('./props');

addProtocolIfNotExists = function (url) {
    if (!(/^(https|http)/.test(url))) {
        url = "http:" + url;
    }
    return url;
};

app.get('/app', function (req, res) {
    var id = req.query.id;

    if (!id) {
        res.status(404).send('Not found');
        return;
    }

    url = 'https://play.google.com/store/apps/details?id=' + id + '&hl=pt-BR';

    request(url, function (error, response, html) {

        if (!error) {
            try {
                var $ = cheerio.load(html);
                var title = $('.document-title').text();
                if (title == '') {
                    throw 404;
                }

                var rating = ($('.score').text()).replace(',', '.');
                var downloads = ($('[itemprop=numDownloads]').text().split(' - ')[0]).replace(/\./g, '');
                var descricao = $('.show-more-content').text();
                var imgs = [];

                var urlIcone = $('img.cover-image').attr('src');
                urlIcone = addProtocolIfNotExists(urlIcone);
                var package = $('.details-wrapper').data('docid')
                var prefixoImgs = package.replace(/\./gi, '_');

                download(urlIcone, props.getDirTemporaryImgs() + prefixoImgs + '.webp', function () {
                    sharp(props.getDirTemporaryImgs() + prefixoImgs + '.webp')
                        .toFile(props.getDirDownloadImgs() + prefixoImgs + '_icon' + '.png', function (err) {
                            //console.error(err);
                        });
                });

                $('.thumbnails img.screenshot').each(function (i, element) {
                    var url = $(element).attr('src');
                    url = addProtocolIfNotExists(url);

                    download(url, props.getDirTemporaryImgs() + prefixoImgs + i + '.webp', function () {
                        sharp(props.getDirTemporaryImgs() + prefixoImgs + i + '.webp').toFile(props.getDirDownloadImgs() + prefixoImgs + '_dsc_' + i + '.png', function (err) {
                            //console.error(err);
                        });
                    });
                    imgs.push(props.getPublicUrlImgs() + '/' + prefixoImgs + '_dsc_' + i + '.png');
                });

                var json = {
                    url: this.href,
                    title: title,
                    rating: rating,
                    downloads: downloads,
                    package: package,
                    img: props.getPublicUrlImgs() + '/' + prefixoImgs + '_icon' + '.png',
                    description: descricao,
                    imgsDescription: imgs
                };

                res.send(json);
            } catch (exc) {
                var statusCode = 505;
                if (!isNaN(exc)) {
                    statusCode = exc;
                }
                res.status(statusCode).send('Error: ' + exc);
                return;
            }
        }
    });
});


app.listen('8081');

console.log('Listening on port 8081');

var download = function (uri, filename, callback) {
    request(uri, {method: 'head'}, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

var wait = false;

// Listening for directory changes and push on s3
fs.watch(props.getDirDownloadImgs(), function (event, filename) {
    // Necessary. Multiples call on single change.
    if (!wait) {
        wait = true;
        setTimeout(function () {
            props.cleanOldFiles();
            child = exec('aws s3 cp ' + props.getDirDownloadImgs() + ' ' + props.getS3Bucket() + ' --region=us-east-1 --recursive', function (error, stdout, stderr) {
                if (error !== null) {
                    console.log('exec error: ' + error);
                }
            });
            wait = false;
        }, 3000);
    }
});

exports = module.exports = app;