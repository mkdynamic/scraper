var http = require('http');
var url = require('url');
var reqwest = require('request');
var fs  = require('fs');
var jsdom = require('jsdom');

var NOOP = function() {};

var Site = function(url, outputResponse) {
    this.url = url;
    this.outputResponse = outputResponse;
};

Site.prototype = {
    _writeOutputResponse: function(urls) {
        var body = JSON.stringify(urls);
        var headers = {
            'Content-Length': body.length,
            'Content-Type': 'application/json'
        };

        this.outputResponse.writeHead(200, headers);
        this.outputResponse.write(body);
        this.outputResponse.end();
    },

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

    _handleResponse: function(error, response, body) {
        var self = this;

        jsdom.env({
            html: body,
            done: function(errors, window) {
                var urls = self._getImageUrls.call(self, window);
                self._writeOutputResponse.call(self, urls);
            },
            features: {
                FetchExternalResources: false,
                ProcessExternalResources: false
            }
        });
    },

    scrapeImages: function() {
        reqwest(
            {
                method: 'GET',
                url: this.url
            },
            this._handleResponse.bind(this)
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

        site.scrapeImages();
    }
};
