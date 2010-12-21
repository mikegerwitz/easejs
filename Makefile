
PATH_BUILD=./build
PATH_TOOLS=./tools
PATH_COMBINE_OUTPUT=${PATH_BUILD}/ease.js

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

# run tests
test:
	for test in `find ./test -name 'test-*.js'`; do \
		node $${test}; \
	done; \
	
	for test in `find ./test -regex '.*/test-[^\.]*'`; do \
		./$$test; \
	done;

# clean up build dir
clean:
	rm -rf ${PATH_BUILD}
	
