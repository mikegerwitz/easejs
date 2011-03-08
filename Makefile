
PATH_BUILD=./build
PATH_TOOLS=./tools
PATH_COMBINE_OUTPUT=${PATH_BUILD}/ease.js
PATH_COMBINE_OUTPUT_FULL=${PATH_BUILD}/ease-full.js
PATH_BROWSER_TEST=${PATH_TOOLS}/browser-test.html
PATH_DOC=./doc

COMBINE=${PATH_TOOLS}/combine


.PHONY: test doc


default: combine
all:     combine doc

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
test: default
	for test in `find ./test -name 'test-*.js'`; do \
		node $${test}; \
	done; \
	
	for test in `find ./test -regex '.*/test-[^\.]*'`; do \
		./$$test; \
	done;

# generate texinfo documentation (twice to generate TOC), then remove the extra
# files that were generaetd
doc:
	pdftex -output-directory "${PATH_DOC}" ${PATH_DOC}/manual.texi;
	pdftex -output-directory "${PATH_DOC}" ${PATH_DOC}/manual.texi;
	find ${PATH_DOC} -type f \
		! -name '*.texi' -a \
		! -name '.*' -a \
		! -name '*.pdf' \
		| xargs rm
	mv ${PATH_DOC}/*.pdf ${PATH_BUILD}/

# clean up build dir
clean: clean-doc
	rm -rf ${PATH_BUILD}

