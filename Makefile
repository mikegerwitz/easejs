
PATH_BUILD=./build
PATH_TOOLS=./tools
PATH_COMBINE_OUTPUT=${PATH_BUILD}/ease.js
PATH_COMBINE_OUTPUT_FULL=${PATH_BUILD}/ease-full.js
PATH_BROWSER_TEST=${PATH_TOOLS}/browser-test.html
PATH_TEST=./test
PATH_PERF_TEST=${PATH_TEST}/perf

PERF_TESTS := $(shell find "$(PATH_PERF_TEST)" -name 'perf-*.js')

PATH_DOC=./doc
PATH_DOC_OUTPUT=${PATH_BUILD}/doc
PATH_DOC_OUTPUT_INFO=${PATH_DOC_OUTPUT}/manual.info
PATH_DOC_OUTPUT_PLAIN=${PATH_DOC_OUTPUT}/manual.txt
PATH_DOC_OUTPUT_HTML=${PATH_DOC_OUTPUT}/manual
PATH_DOC_OUTPUT_HTML1=${PATH_DOC_OUTPUT}/manual.html
PATH_DOC_CSS=${PATH_DOC}/manual.css
PATH_DOC_IMG=${PATH_DOC}/img
PATH_MANUAL_TEXI=${PATH_DOC}/manual.texi

doc_src := $(wildcard $(PATH_DOC)/*.texi)
doc_imgs := $(patsubst %.dia, %.png, $(wildcard $(PATH_DOC_IMG)/*.dia))

COMBINE=${PATH_TOOLS}/combine

TESTS := $(shell find "$(PATH_TEST)" \
	-name 'test-*' \
	-a ! -name 'test-combine*.js'\
)
TEST_COMBINE := $(PATH_TEST)/test-combine*.js


.PHONY: test test-combine doc


default: combine
all:     combine doc

# create build dir
mkbuild:
	mkdir -p "$(PATH_BUILD)"
$(PATH_DOC_OUTPUT):
	mkdir -p "$(PATH_DOC_OUTPUT)"
mkbuild-doc: | $(PATH_DOC_OUTPUT)

# combine all modules into easily redistributable ease.js file (intended for
# browser)
combine: mkbuild
	${COMBINE} > "${PATH_COMBINE_OUTPUT}"
	INC_TEST=1 "${COMBINE}" > "${PATH_COMBINE_OUTPUT_FULL}"
	cp "${PATH_BROWSER_TEST}" "${PATH_BUILD}"

# run tests
test: default $(TESTS) test-combine
test-combine: default $(TEST_COMBINE)
test-%.js: default
	node $@
test-%: default
	./$@

# performance tests
perf: default $(PERF_TESTS)
perf-%.js: default
	@node $@

# generate texinfo documentation (twice to generate TOC), then remove the extra
# files that were generated
#
# generates: pdf, info, HTML (multiple pages), HTML (single page)
doc: | doc-pdf doc-info doc-plain doc-html

# doc images
doc/img/%.png: doc/img/%.dia
	dia -e $@ -s 600x $<

# doc pdf
$(PATH_DOC_OUTPUT)/%.pdf: $(doc_src) | mkbuild-doc doc-img
	TEXINPUTS="$(PATH_DOC):" \
		pdftex -output-directory "${PATH_DOC}" "${PATH_MANUAL_TEXI}" && \
		TEXINPUTS="$(PATH_DOC):" \
		pdftex -output-directory "${PATH_DOC}" "${PATH_MANUAL_TEXI}"
	mv -f "${PATH_DOC}"/*.pdf "${PATH_DOC_OUTPUT}"
	cd "$(PATH_DOC)" && rm -f $(shell cat "$(PATH_DOC)/.gitignore")

# doc info
$(PATH_DOC_OUTPUT_INFO): $(doc_src) | mkbuild-doc
	makeinfo -I "$(PATH_DOC)" -o $@ "$(PATH_MANUAL_TEXI)";

# doc plain text
$(PATH_DOC_OUTPUT_PLAIN): | mkbuild-doc
	makeinfo --plain -I "$(PATH_DOC)" "${PATH_MANUAL_TEXI}" > $@

# doc html (multiple pages)
$(PATH_DOC_OUTPUT_HTML)/index.html: | $(PATH_DOC_OUTPUT_HTML)/img mkbuild-doc doc-img
	makeinfo --html --css-include="${PATH_DOC_CSS}" \
		-I "$(PATH_DOC)" -o "${PATH_DOC_OUTPUT_HTML}" "${PATH_MANUAL_TEXI}";

# doc html (single page)
$(PATH_DOC_OUTPUT_HTML1): | $(PATH_DOC_OUTPUT)/img mkbuild-doc doc-img
	makeinfo --no-split --html --css-include="${PATH_DOC_CSS}" \
		-I "$(PATH_DOC)" -o "${PATH_DOC_OUTPUT_HTML1}" "${PATH_MANUAL_TEXI}";

# doc images (in build dir)
$(PATH_DOC_OUTPUT)/img: | mkbuild-doc doc-img
	mkdir -p $@
	cp "$(PATH_DOC_IMG)"/*.png $@
$(PATH_DOC_OUTPUT_HTML)/img: $(PATH_DOC_OUTPUT)/img
	mkdir -p $(PATH_DOC_OUTPUT_HTML)
	ln -s ../img $@

doc-img: $(doc_imgs)
doc-pdf: $(PATH_DOC_OUTPUT)/manual.pdf
doc-info: $(PATH_DOC_OUTPUT_INFO)
doc-plain: $(PATH_DOC_OUTPUT_PLAIN)
doc-html: $(PATH_DOC_OUTPUT_HTML)/index.html $(PATH_DOC_OUTPUT_HTML1)

# clean up build dir
clean:
	rm -rf "${PATH_BUILD}"
	rm -rf $(PATH_DOC_IMG)/*.png

