
PATH_BUILD=./build
PATH_TOOLS=./tools
PATH_COMBINE_OUTPUT=${PATH_BUILD}/ease.js
PATH_COMBINE_OUTPUT_FULL=${PATH_BUILD}/ease-full.js

COMBINE=${PATH_TOOLS}/combine


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

# run tests
test: default
	for test in `find ./test -name 'test-*.js'`; do \
		node $${test}; \
	done; \
	
	for test in `find ./test -regex '.*/test-[^\.]*'`; do \
		./$$test; \
	done;

# clean up build dir
clean:
	rm -rf ${PATH_BUILD}
	
