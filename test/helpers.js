var scraper = require('../lib/scraper.js');
var reqwest = require('request');
var http = require('http');
var url = require('url');
var _ = require('underscore');

// scraper server
var CONFIG = { port: 8888 };
var server = new scraper.Server(CONFIG);
server.start(function() {
    console.log('>>> Server started on port ' + CONFIG.port);
});
exports.server = server;

// dummy site
var DUMMY_SITE_CONFIG = { port: 8889 };
var DummySite = function(config) {
    this._config = config;
    this._server = http.createServer(this._handler.bind(this));
};
DummySite.prototype = {
    routes: {},

    url: function(path) {
        var uri = url.parse(path, true);
        uri.protocol = 'http';
        uri.hostname = '0.0.0.0';
        uri.port = this._config.port;
        return url.format(uri);
    },

    start: function() {
        this._server.listen(this._config.port);
        console.log('>>> Dummy site running on port ' + this._config.port);
    },

    _handler: function(request, response) {
        var path = url.parse(request.url, true).path;
        var route = this.routes[path];
        var status = route[0];
        var body = route[2];
        var headers = _.extend({
            'Content-Length': body.length
        }, route[1]);

        setTimeout(
            function() {
                response.writeHead(status, headers);
                if (body) {
                    response.write(body);
                }
                response.end();
            },
            Math.random() * 1000
        );
    }
};
var dummySite = new DummySite(DUMMY_SITE_CONFIG);
dummySite.start();
exports.dummySite = dummySite;

// helpers
exports.requestTopic = function(url) {
    return function() {
        var query = '?url=' + encodeURIComponent(url);

        reqwest(
            {
                method: 'GET',
                url: 'http://0.0.0.0:' + CONFIG.port + '/1.0/images' + query,
                headers: { 'Accept': 'application/json' }
            },
            this.callback
        );
    };
};
