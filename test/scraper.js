var scraper = require('../lib/scraper.js');
var vows = require('vows');
var assert = require('assert');
var reqwest = require('request');
var http = require('http');
var url = require('url');
var _ = require('underscore');

// scraper server
var CONFIG = { port: 8888 };
var server = new scraper.Server(CONFIG);
server.start();

// dummy site
var DUMMY_SITE_CONFIG = { port: 8889 };
var DummySite = function(config) {
    this._config = config;
    this._server = http.createServer(this._handler.bind(this));
};
DummySite.prototype = {
    routes: {},

    start: function() {
        this._server.listen(this._config.port);
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
dummySite.routes = {
    '/foo/bar.html': [
        200,
        { 'Content-Type': 'text/html' },
        '<html><body>' +
        '<img src="http://a248.e.akamai.net/assets.github.com/images/modules/about_page/github_logo.png" />' +
        '<img src="/foo.png" />' +
        '<img src="../foo.png" />' +
        '<img src="../gyp/foo.png" />' +
        '</body></html>'
    ],
    '/foo.png': [
        200,
        { 'Content-Type': 'image/png' },
        'MA IMAGE'
    ]
};
dummySite.start();

// helpers
var helpers = {};
helpers.requestTopic = function(url) {
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

// test suite
var test = vows.describe('GET /1.0/images').addBatch({
    'a site with a bunch of images': {
        topic: helpers.requestTopic('http://0.0.0.0:' + DUMMY_SITE_CONFIG.port + '/foo/bar.html'),

        'returns an Array containing unqiue fully qualified image URLS as JSON': function(error, response, body) {
            var expected = [
                'http://a248.e.akamai.net/assets.github.com/images/modules/about_page/github_logo.png',
                'http://0.0.0.0:' + DUMMY_SITE_CONFIG.port + '/foo.png',
                'http://0.0.0.0:' + DUMMY_SITE_CONFIG.port + '/gyp/foo.png'
            ];

            assert.deepEqual(JSON.parse(body), expected);
        }
    }
});

test.export(module);
