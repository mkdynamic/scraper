var helpers = require('./helpers.js');
var vows = require('vows');
var assert = require('assert');

vows.describe('GET /1.0/images').addBatch({
    'a site with a bunch of images': {
        topic: helpers.requestTopic('http://0.0.0.0:' + helpers.dummySite._config.port + '/foo/bar.html'),

        'returns an Array containing unqiue fully qualified image URLS as JSON': function(error, response, body) {
            var expected = [
                'http://a248.e.akamai.net/assets.github.com/images/modules/about_page/github_logo.png',
                'http://0.0.0.0:' + helpers.dummySite._config.port + '/foo.png',
                'http://0.0.0.0:' + helpers.dummySite._config.port + '/gyp/foo.png'
            ];

            assert.deepEqual(JSON.parse(body), expected);
        }
    }
}).export(module);
