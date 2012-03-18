var http = require('http');
var url = require('url');
var reqwest = require('request');
var fs  = require('fs');
var jsdom = require('jsdom');

var JQUERY = fs.readFileSync('./vendor/jquery.js').toString();
var NOOP = function() {};

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

        console.log('>>> Scraping images from ' + url.format(targetUrl));

        reqwest(
            {
                method: 'GET',
                url: targetUrl
            },
            function(siteError, siteResponse, siteBody) {
                jsdom.env({
                    html: siteBody,
                    src: [JQUERY],
                    done: function(errors, window) {
                        var $ = window.$;
                        var imgs = $('img');
                        var urls = [];

                        for (var i = 0; i < imgs.length; i++) {
                            var img = imgs[i];
                            var fullyQualifiedUrl = url.resolve(targetUrl, img.src);

                            if (urls.indexOf(fullyQualifiedUrl) < 0) {
                                urls.push(fullyQualifiedUrl);
                            }
                        }

                        var body = JSON.stringify(urls);
                        var headers = {
                            'Content-Length': body.length,
                            'Content-Type': 'application/json'
                        };

                        response.writeHead(200, headers);
                        response.write(body);
                        response.end();
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
