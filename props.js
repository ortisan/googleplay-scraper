var fs = require('fs');
var moment = require('moment');
moment().format();

module.exports = {
    getS3Bucket: function () {
        return 's3://homolog-dm-icon.mundopositivo.com.br';
    },

    getPublicUrlImgs: function () {
        return 'http://homolog-dm-icon.mundopositivo.com.br';
    },

    getDirTemporaryImgs: function () {
        return './tmp/';
    },

    getDirDownloadImgs: function () {
        return './imgs/';
    },

    cleanOldFiles: function () {
        var temp = this.getDirTemporaryImgs();
        var dir = this.getDirDownloadImgs();

        var deleteOldFile = function (filePath) {
            fs.stat(filePath, function (err, stats) {

                //var lastWeek = moment().subtract(7, 'days');
                var lastWeek = moment().subtract(1, 'minutes');

                var isAfter = lastWeek.isAfter(stats.mtime);

                if (isAfter) {
                    try {
                        fs.unlink(filePath);
                    } catch (exc) {
                        console.error(exc);
                    }
                }
            });
        };

        // Clean temp file
        fs.readdirSync(temp).forEach(function (fileName) {
            var tempFilePath = temp + fileName;
            deleteOldFile(tempFilePath)
        });

        // Clean dir file
        fs.readdirSync(dir).forEach(function (fileName) {
            var dirFilePath = dir + fileName;
            deleteOldFile(dirFilePath)
        });
    }
};