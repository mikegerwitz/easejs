
PATH_BUILD=./build
PATH_TOOLS=./tools
PATH_COMBINE_OUTPUT=${PATH_BUILD}/ease.js
PATH_COMBINE_OUTPUT_FULL=${PATH_BUILD}/ease-full.js
PATH_BROWSER_TEST=${PATH_TOOLS}/browser-test.html
PATH_TEST=./test
PATH_PERF_TEST=${PATH_TEST}/perf

PERF_TESTS := $(shell find "$(PATH_PERF_TEST)" -name 'perf-*.js')

COMBINE=${PATH_TOOLS}/combine

TESTS := $(shell find "./test" -name 'test-*')


.PHONY: test


default: combine

# create build dir
mkbuild:
	mkdir -p ${PATH_BUILD}

# combine all modules into easily redistributable ease.js file (intended for
# browser)
combine: mkbuild
	${COMBINE} > ${PATH_COMBINE_OUTPUT}
	INC_TEST=1 ${COMBINE} > ${PATH_COMBINE_OUTPUT_FULL}
	cp ${PATH_BROWSER_TEST} ${PATH_BUILD}

# run tests
test: default $(TESTS)
test-%.js: default
	node $@
test-%: default
	./$@

# performance tests
perf: default $(PERF_TESTS)
perf-%.js: default
	@node $@

# clean up build dir
clean:
	rm -rf ${PATH_BUILD}

