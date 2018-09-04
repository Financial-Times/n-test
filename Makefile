node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

# The reason for passing --runInBand to jest in CI:
# https://facebook.github.io/jest/docs/en/troubleshooting.html#tests-are-extremely-slow-on-docker-and-or-continuous-integration-ci-server
unit-test:
	export TEST_SESSIONS_URL=https://fuhn0pye67.execute-api.eu-west-1.amazonaws.com/prod; \
	export TEST_SESSIONS_API_KEY=mock-api-key; \
	jest test/tasks/*.js --testURL="http://localhost/" --forceExit $(if $(CI), --ci --runInBand --testResultsProcessor="jest-junit", )

test: verify unit-test
