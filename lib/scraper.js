var http = require('http');
var url = require('url');
var reqwest = require('request');
var fs  = require('fs');
var jsdom = require('jsdom');

var NOOP = function() {};

var Site = function(url) {
    this.url = url;
};

Site.prototype = {
    _getImageUrls: function(window) {
        var imgs = window.document.getElementsByTagName('img');
        var urls = [];

        for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            var fullyQualifiedUrl = url.resolve(this.url, img.src);

            if (urls.indexOf(fullyQualifiedUrl) < 0) {
                urls.push(fullyQualifiedUrl);
            }
        }

        return urls;
    },

    scrapeImages: function(callback) {
        var self = this;

        reqwest(
            {
                method: 'GET',
                url: this.url
            },
            function(error, response, body) {
                jsdom.env({
                    html: body,
                    done: function(errors, window) {
                        var urls = self._getImageUrls.call(self, window);
                        callback(urls);
                    },
                    features: {
                        FetchExternalResources: false,
                        ProcessExternalResources: false
                    }
                });
            }
        );
    }
};

exports.Server = function(config) {
    this._config = config;
    this._server = http.createServer(this._handler.bind(this));
};

exports.Server.prototype = {
    start: function(callback) {
        this._server.listen(this._config.port, callback || NOOP);
    },

    _handler: function(request, response) {
        var params = url.parse(request.url, true).query;
        var targetUrl = url.parse(params['url']);
        var site = new Site(targetUrl, response);

        site.scrapeImages(function(urls) {
            var body = JSON.stringify(urls);
            var headers = {
                'Content-Length': body.length,
                'Content-Type': 'application/json'
            };

            response.writeHead(200, headers);
            response.write(body);
            response.end();
        });
    }
};
