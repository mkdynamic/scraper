var scraper = require('../lib/scraper.js'),
    vows = require('vows'),
    assert = require('assert'),
    request = require('request'),
    http = require('http');

// scraper server
var PORT = 8888;
var server = new scraper.Server(PORT);
server.start();

// dummy site
var dummySite = http.createServer(
    function(request, response) {
        var body = '<html><body><img src="/foo.png" /></body></html>';
        var headers = {
            'Content-Length': body.length,
            'Content-Type': 'text/html'
        };

        setTimeout(
            function() {
                response.writeHead(200, headers);
                response.write(body);
                response.end();
            },
            Math.random() * 1000
        );
    }
).listen(8889);

var test = vows.describe('GET /1.0/images').addBatch({
    'a site with 1 image (/foo.png)': {
        topic: function() {
            var query = '?url=' + encodeURIComponent('http://0.0.0.0:8889/bar.html');

            request(
                {
                    method: 'GET',
                    url: 'http://0.0.0.0:' + PORT + '/1.0/images' + query,
                    headers: { accept: 'application/json' }
                },
                this.callback
            );
        },

        'returns an Array containing images as JSON': function(error, response, body) {
            assert.deepEqual(JSON.parse(body), ['/foo.png']);
        }
    }
});

test.export(module);
