var http = require('http'),
    url = require('url'),
    req = require('request'),
    jsdom = require('jsdom'),
    fs  = require('fs');

var jquery = fs.readFileSync('./vendor/jquery.js').toString();
var NOOP = function() {};

exports.Server = function(port) {
    this._port = port;
    this._server = http.createServer(
        function(request, response) {
            var params = url.parse(request.url, true).query;

            req(
                {
                    method: 'GET',
                    url: params['url']
                },
                function(siteError, siteResponse, siteBody) {
                    jsdom.env({
                        html: siteBody,
                        src: [jquery],
                        done: function(errors, window) {
                            var $ = window.$;

                            var imgs = $('img');
                            var urls = [];

                            for (var i = 0; i < imgs.length; i++) {
                                var img = imgs[i];
                                urls.push(img.src);
                            }

                            var body = JSON.stringify(urls);
                            var headers = {
                                'Content-Length': body.length,
                                'Content-Type': 'application/json'
                            };

                            response.writeHead(200, headers);
                            response.write(body);
                            response.end();
                        }
                    });
                }
            );
        }
    );
};

exports.Server.prototype = {
    start: function(callback) {
        this._server.listen(this._port, callback || NOOP);
    }
};
