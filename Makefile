
CWD=$(CURDIR)
PATH_BUILD=${CWD}/build
PATH_TOOLS=${CWD}/tools
PATH_COMBINE_OUTPUT=${PATH_BUILD}/ease.js
PATH_COMBINE_OUTPUT_FULL=${PATH_BUILD}/ease-full.js
PATH_BROWSER_TEST=${PATH_TOOLS}/browser-test.html
PATH_DOC=${CWD}/doc
PATH_DOC_OUTPUT=${PATH_BUILD}/doc
PATH_DOC_OUTPUT_HTML=${PATH_DOC_OUTPUT}/manual
PATH_MANUAL_TEXI=${PATH_DOC}/manual.texi

COMBINE=${PATH_TOOLS}/combine


.PHONY: test doc


default: combine
all:     combine doc

# create build dir
mkbuild:
	@mkdir -p ${PATH_BUILD}

# combine all modules into easily redistributable ease.js file (intended for
# browser)
combine: mkbuild
	${COMBINE} > ${PATH_COMBINE_OUTPUT}
	INC_TEST=1 ${COMBINE} > ${PATH_COMBINE_OUTPUT_FULL}
	@cp ${PATH_BROWSER_TEST} ${PATH_BUILD}

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
	@mkdir -p ${PATH_DOC_OUTPUT}
	pdftex -output-directory "${PATH_DOC}" ${PATH_MANUAL_TEXI}
	pdftex -output-directory "${PATH_DOC}" ${PATH_MANUAL_TEXI}
	find ${PATH_DOC} -type f \
		! -name '*.texi' -a \
		! -name '.*' -a \
		! -name '*.pdf' \
		| xargs rm
	@mv -f ${PATH_DOC}/*.pdf ${PATH_DOC_OUTPUT}
	cd ${PATH_DOC}; \
		makeinfo --html -o ${PATH_DOC_OUTPUT_HTML} ${PATH_MANUAL_TEXI}

# clean up build dir
clean:
	rm -rf ${PATH_BUILD}

