# n-test
A CLI tool and module for testing web applications, designed for FT.com.

## Tasks

### Smoke tests

FT.com is built up of dozens of microservices, that are deployed dozens of times a day. Running full browser or integration tests for each of these results in both slower development and build time.

Smoke tests are designed to be a quick sanity check against a set of endpoints to check that they are actually working, rendering the elements that you expect and haven't introduced any performance regressions.

Rather than the chore of writing tests, simply add some JS config (default location - tests/smoke.js) with some URLs (and optional headers) and some expectations. 

`n-test smoke`

`n-test smoke --config path/to/config.js --host https://local.ft.com:3002`

`n-test smoke basic` - runs just the set with the name 'basic'

`n-test smoke -i` - interactively select the suites to run

*Example config*
```
module.exports = [
  {
    name: 'basic',
    urls: {
      '/': {
        status: 200,
        "cssCoverage": {
            '/article/UUID': 20
        },
        elements: {
            '.selector': 4,
            '.other-selector': 'Contains this text'
        },
        cacheHeaders: true, //verify Cache-Control and Surrogate headers are sensible
        pageErrors: 0, // NOTE: should probably only use this with ads disabled
        performance: true //checks firstPaint/firstContentfulPaint against baseline. default = 2000, or can specify.
        ]
      },
      '/some/path': 200,
      '/post': {
          status: 200,
          body: { "some": "data" },
          method: 'POST'
      }
    }
  },
  {
    name: 'headers',
    headers: {
      'some-header': 1
    }
    urls: {
      '/run-with-header': {
        status: 200,
        content: (content) => {
          return content.includes('some-text');
        }
      },
      '/run-with-additional-headers': {
        headers: { 'some-other-header': 'value' }
        status: 200
      }
    }
  },
  {
    name: 'redirects',
    urls: {
      '/redirect-code': {
        status: 302,
        content: (eventualContent) => {
          return eventualContent.includes('some-text');
        }
      },
      '/redirect-location': '/eventual-path'
    }
  }
]
```

**Using programatically**

```
const nTest = require('@financial-times/n-test');
nTest.smoke.run({ auth: true, host: 'local.ft.com:3002' })
	.then((results) => { //all passed })
	.catch((results) => { //some failed });

nTest.smoke.run({}, ['basic']);
```

#### Open

Opens an instance of Chromium with all of the URLs specified in the smoke tests, for manual verification.

`n-test open` - interactively select which sets of of URLs to open

`n-test open headers --breakpoint M --config path/to/config.js --host https://local.ft.com:3002`

#### HALPPPPP

Call upon `n-test HALP` to get you through the tough times.
