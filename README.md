# n-test
Runs smoke tests with Puppeteer (and optionally Browserstack). Define a set of URLs and expected behaviour in JSON, without the toil of writing full blown tests.

[![CircleCI](https://circleci.com/gh/Financial-Times/n-test.svg?style=svg&circle-token=d042713e08cb5920c4c2b462e63867d4906a7a66)](https://circleci.com/gh/Financial-Times/n-test)
[![Node.js version support][shield-node]](#)

[shield-github]: (https://img.shields.io/github/tag/Financial-Times/n-test.svg
[shield-node]: https://img.shields.io/badge/node.js%20support->=8.0.0-brightgreen.svg


```
n-test smoke
n-test smoke --config path/to/config.js --host http://local.ft.com:3002 --header "X-Api-Key: 1234"
n-test smoke basic
n-test smoke -i

n-test open
n-test open headers --breakpoint M --config path/to/config.js --host https://local.ft.com:3002
```

Table of Contents
-----------------
  * [Requirements](#requirements)
  * [Usage](#usage)
	  * [Expectations](#expectations)
	  * [Request types](#request-types)
	  * [FT User Sessions](#ft-user-sessions)
	  * [Using Programatically](#using-programatically)
	  * [Cross Browser Testing](#cross-browser-testing-experimental)
  * [Contributing](#contributing)


Requirements
------------

n-test requires the following to run:
* [Node.js][node] v8.0.0+
* [npm][npm] (normally comes with Node.js)


Usage
-----

n-test is easiest to use as a command line tool, installed by npm.

`npm install @financial-times/n-test`

You must create a _config file_ containing the set of URLs to test. This will be a javascript file, that exports an array of test suites. The default location is `test/smoke.js`. This can be overriden with a command line parameter.

```
module.exports = [
	{
		name: 'basic',
		urls: {
			'/': 200,
			'/redirect': '/'
		}
	}
];
```

Then, you can run (assuming your application is running on port 8080 - the default is 3002):

`n-test smoke -H http://localhost:8080`

This will run a headless browser, open the URLs and check (in the above case) the response status is 200 for / and '/redirect' redirects to '/'. If both of those things are true, the command will exit with a success status.

You can also run:

`n-test open -H http://localhost:8080`

This allows you to select a suite of URLs (in this case, "basic"), and open them in Chromium. This is useful for manually testing a set of URLs.

If, when running locally, you are seeing errors about certificates not being valid, set NODE_ENV to be 'development' e.g. `NODE_ENV=development;n-test smoke -H http://localhost:8080`. This will use some launch options that ignore certificate errors.

### Expectations

Checking response statii is great for checking that your application responds with _something_, but not necessarily the right thing. n-test comes with a bunch of basic things that you check for.

```
...
urls: {
	'/article/1234': {
		status: 200,
		elements: {
			'.this-should-exist-somewhere': true,
			'.there-should-be-3-of-these': 3,
			'div[exists=false]': false,
			'#should-contain-text': 'text'
		},
		elementShifts: {
			'.this-should-not-move': { maxCount: 0 },
			'.this-can-move-up-to-3-times': { maxCount: 0 },
			'.this-can-only-move-up-to-100-px': { maxPixels: 100 }
		},
		responseHeaders: {
			'My-Header': 'expected-value'
		},
		pageErrors: 0,
		networkRequests: {
			'/some-third-party.js': 1,
			'tracking.pixel': 4, //asserts 4 network requests were made to a URL containing 'tracking.pixel'
			'/will-have-some-of-these.jpg': true,,
			'/validates-this-request-response-body': {
				analytics: {
					event: "data",
				}
			} // asserts that the network request to this URL contains this object as part of the response body
			'should-not-load-this.js': false
		},
		content: (content) => {
			return content.includes('some-text');
		},
		visibleContent: {
		  contentSelector: '.headline, .image, .standfirst'
		  threshold: 30 // % of viewport that should be visible content
		},
		performance: true //checks firstPaint/firstContentfulPaint against baseline. default = 2000, or can specify.
	}
}
...
```

### Request types

By default, URLs are assumed to be GET requests, but you can also specify request method/headers/bodies.

```
...
urls: {
	'/article/1234': {
		headers: {
			'My-Request-Header': 1
		}
	},
	'/post': {
		body: { "some": "data" },
		method: 'POST',
		status: 200,
		https: true //Force this URL to be requested over HTTPS, even if the host is not
	},
	'/wait-for-load': {
		waitUntil: 'load' //default = domcontentloaded
		elements: {
		  '.loaded-by-js': true
		}
	}
}
...
```

These can all be set at a suite level, as well as a URL level, like so:


```
...
{
	name: 'authenticated-requests',
	headers: {
		'api-key': process.env.API_KEY
	},
	urls: {
		'/article/1': 200,
		'/article/2': 200,
		'/article/404': 404
	}
}
...
```
### Actions

n-test allows some basic actions (e.g. clicking, interacting with forms). This has been ported from [pa11y](https://github.com/pa11y/pa11y) - see the [section on their README](https://github.com/pa11y/pa11y/blob/5.0.4/README.md#actions) for more.

### FT User Sessions

To run a test suite for a type of FT subscriber, add a `user` property to the suite and it will set the session tokens for that type of user before running the tests in that suite.

*Options:* `premium`, `standard`, `expired`.

*Remarks*

Needs to set TEST_SESSIONS_URL (url to [`next-test-sessions-lambda`](http://github.com/financial-times/next-test-sessions-lambda)) and TEST_SESSIONS_API_KEY environment variables when running the tests.

*Example*
```
[
  {
	user: 'premium',
	urls: [
	  '/these-will': 200,
	  '/run-with-a': 200,
	  '/premium-user': 200
	]
  },
  {
	'user': 'standard',
	'urls': [
	  '/this-will-run-with-a-standard-user': 200
	]
  },
  {
	'urls': [
	  '/these-will-run': 403,
	  '/without-session-token': 403
	]
  }
]
```


### Using Programatically

`n-test` can also be used programatically. This allows you to extend the functionality by adding custom expectations. Below is an example.

```
const SmokeTest = require('@financial-times/n-test').SmokeTest;
const smoke = new SmokeTests({ headers: { globalHeader: true },  host: 'local.ft.com:3002' });

//Add custom checks like so:
smoke.addCheck('custom', async (testPage) => {
	const metrics = await testPage.page.metrics();

	return {
		expected: `no more than ${testPage.check.custom} DOM nodes`,
		actual: `${metrics.Nodes} nodes`,
		result: testPage.check.custom >= metrics.Nodes
	}
});

smoke.run()
	.then((results) => { //all passed })
	.catch((results) => { //some failed });

smoke.run(['basic']);
```

### Cross Browser Testing [Experimental]
You can also run your test suite against Browserstack .

Browserstack: you must have `BROWSERSTACK_USER` and `BROWSERSTACK_KEY` environment variables set, and enable cross browser tests on a suite/url basis.

*Note* Browserstack supports running off a local host. If your host is local, it will spin up Browserstack Local and proxy through.
*Caveat* sometimes browserstack local might not clean up properly after itself!

```
{
	name: 'blah'
	urls: {
		'/only-puppeteer': {
			status: 200
		},
		'/no-element-checks': {
			status: 200,
			browsers: true
		},
		'/runs-all-browsers': {
			status: 200,
			elements: {
				'.js-success': true
			},
			browsers: true //runs against all enabled browsers, default ['chrome', 'firefox', 'safari', 'internet explorer', 'MicrosoftEdge', 'android'];
		},
		'/ios-only': {
			status: 200,
			elements: {
				'.app-install-banner': true
			},
			browsers: ['ios']
		},
	}
}
```

The set of enabled browsers to run against can be changed on the command line:

`n-test smoke --browsers "chrome,internet explorer,android"`


### Cross Browser Screenshotting [Experimental]

There are two ways to get screenshots generated.

1. As part of your smoke test run, you can generate PNG files with every run:

Example:
```
{
	name: 'blah'
	urls: {
		'/screenshot-me': {
			status: 200,
			screenshot: {
				path: './tmp/screenshots'
			}
		}
	}
}
```

2. A command that takes screenshots on multiple browsers, and opens them in a headless chrome window.

`n-test screenshot --browsers ie9,safari`

#### HALPPPPP

Call upon `n-test HALP` to get you through the tough times.

If a test is failing because a subscription has expired, e.g. the premium subscription on nextpremium@ftqa.org has expired, email customer support to renew it.
