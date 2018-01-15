# n-test
A node module containing a collection of test tasks and utilities for Next applications

## Why does this exist?

To share common testing CLI tasks, fixtures, snippets of useful test code for FT.com applications and components.

## Tasks

#### Smoke tests

Runs a set of basic tests against URLs. These are specified in a JSON config (default location: test/smoke.json).


`n-test smoke`

`n-test smoke --config path/to/config.json --host https://local.ft.com:3002`

*Example config*
```
{
  "tests": [
    {
      "url": "/article/UUID",
      "expect": {
        "status": 200,
        "cssCoverage": [
          {
            "url": "/article/UUID",
            "threshold": 20
          }
        ]
      }
    }
  ]
}

```
