# n-test
A node module containing a collection of test tasks and utilities for FT.com applications

## Why does this exist?

To share common testing CLI tasks, fixtures, snippets of useful test code for FT.com applications and components.

## Tasks

### Smoke tests

Runs a set of basic tests against URLs. These are specified in a JSON config (default location: test/smoke.js).


`n-test smoke`

`n-test smoke --config path/to/config.js --host https://local.ft.com:3002`

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
  }
]
```

**Using programatically**

```
const nTest = require('@financial-times/n-test');
nTest.smoke.run({ auth: true, host: 'local.ft.com:3002' })
	.then((results) => { //all passed })
	.catch((results) => { //some failed })
```

#### Open

Opens an instance of Chromium with all of the URLs specified in the smoke tests, for manual verification.

`n-test open`

`n-test open headers --breakpoint M --config path/to/config.js --host https://local.ft.com:3002`

#### HALPPPPP

Call upon `n-test HALP` to get you through the tough times.
