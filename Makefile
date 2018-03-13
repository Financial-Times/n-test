node_modules/@financial-times/n-gage/index.mk:
	npm install --no-save @financial-times/n-gage
	touch $@

-include node_modules/@financial-times/n-gage/index.mk

test:
	export TEST_SESSIONS_URL=https://fuhn0pye67.execute-api.eu-west-1.amazonaws.com/prod; \
	export TEST_SESSIONS_API_KEY=mock-api-key; \
	jest test/tasks/*.js --forceExit
