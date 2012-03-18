var helpers = require('./helpers.js');
var vows = require('vows');
var assert = require('assert');

helpers.dummySite.routes = {
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

vows.describe('GET /1.0/images').addBatch({
    'a site with a bunch of images': {
        topic: helpers.requestTopic(helpers.dummySite.url('/foo/bar.html')),

        'returns an Array containing unqiue fully qualified image URLS as JSON': function(error, response, body) {
            var expected = [
                'http://a248.e.akamai.net/assets.github.com/images/modules/about_page/github_logo.png',
                helpers.dummySite.url('/foo.png'),
                helpers.dummySite.url('/gyp/foo.png')
            ];

            assert.deepEqual(JSON.parse(body), expected);
        }
    }
}).export(module);
