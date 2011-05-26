
PATH_BUILD=./build
PATH_TOOLS=./tools
PATH_LIB=./lib
PATH_COMBINE_OUTPUT=${PATH_BUILD}/ease.js
PATH_COMBINE_OUTPUT_FULL=${PATH_BUILD}/ease-full.js
PATH_BROWSER_TEST=${PATH_TOOLS}/browser-test.html
PATH_TEST=./test
PATH_PERF_TEST=${PATH_TEST}/perf

PERF_TESTS := $(shell find "$(PATH_PERF_TEST)" -name 'perf-*.js')

PATH_DOC=./doc
PATH_DOC_OUTPUT=${PATH_BUILD}/doc
PATH_DOC_OUTPUT_INFO=${PATH_DOC_OUTPUT}/easejs.info
PATH_DOC_OUTPUT_PLAIN=${PATH_DOC_OUTPUT}/manual.txt
PATH_DOC_OUTPUT_HTML=${PATH_DOC_OUTPUT}/manual
PATH_DOC_OUTPUT_HTML1=${PATH_DOC_OUTPUT}/manual.html
PATH_DOC_CSS=${PATH_DOC}/manual.css
PATH_DOC_IMG=${PATH_DOC}/img
PATH_DOC_INTERACTIVE_SRC=$(PATH_DOC)/interactive.js
PATH_DOC_INTERACTIVE_DEST=$(PATH_DOC_OUTPUT)/interactive.js \
	$(PATH_DOC_OUTPUT_HTML)/interactive.js
PATH_MANUAL_TEXI=${PATH_DOC}/manual.texi

path_info_install := /usr/local/share/info

src_js := index.js $(wildcard $(PATH_LIB)/*.js)
src_tests := index.js $(wildcard $(PATH_TEST)/test-*)
doc_src := $(wildcard $(PATH_DOC)/*.texi)
doc_imgs := $(patsubst %.dia, %.png, $(wildcard $(PATH_DOC_IMG)/*.dia))
doc_imgs_txt := $(patsubst %.dia, %.png, $(wildcard $(PATH_DOC_IMG)/*.txt))

doc_replace := s/<\/body>/<script type="text\/javascript" \
	src="interactive.js"><\/script><\/body>/

COMBINE=${PATH_TOOLS}/combine


.PHONY: combine doc test test-combine


default: combine min
all:     combine doc

# create build dir
$(PATH_BUILD):
	mkdir -p "$(PATH_BUILD)"
$(PATH_DOC_OUTPUT):
	mkdir -p "$(PATH_DOC_OUTPUT)"
mkbuild: $(PATH_BUILD)
mkbuild-doc: $(PATH_DOC_OUTPUT)

# combine all modules into easily redistributable ease.js file (intended for
# browser)
$(PATH_COMBINE_OUTPUT): $(src_js) | mkbuild
	${COMBINE} > "$(PATH_COMBINE_OUTPUT)"
$(PATH_COMBINE_OUTPUT_FULL): $(src_js) $(src_tests) | mkbuild
	INC_TEST=1 "$(COMBINE)" > "${PATH_COMBINE_OUTPUT_FULL}"
$(PATH_BUILD)/browser-test.html: $(PATH_COMBINE_OUTPUT_FULL)
	cp "$(PATH_BROWSER_TEST)" "$(PATH_BUILD)"
combine: $(PATH_COMBINE_OUTPUT) $(PATH_BUILD)/browser-test.html


test: default
	$(MAKE) -C $(PATH_TEST)

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
	dia -e $@ -s 300x $<

# doc pdf
$(PATH_DOC_OUTPUT)/%.pdf: $(doc_src) $(doc_imgs) | mkbuild-doc doc-img
	TEXINPUTS="$(PATH_DOC):" \
		pdftex -output-directory "${PATH_DOC}" "${PATH_MANUAL_TEXI}" && \
		TEXINPUTS="$(PATH_DOC):" \
		pdftex -output-directory "${PATH_DOC}" "${PATH_MANUAL_TEXI}"
	mv -f "${PATH_DOC}"/*.pdf "${PATH_DOC_OUTPUT}"
	cd "$(PATH_DOC)" && rm -f $(shell cat "$(PATH_DOC)/.gitignore")

# doc info
$(PATH_DOC_OUTPUT_INFO): $(doc_src) $(doc_imgs_txt) | mkbuild-doc
	makeinfo -I "$(PATH_DOC)" -o $@ "$(PATH_MANUAL_TEXI)";

# doc plain text
$(PATH_DOC_OUTPUT_PLAIN): $(doc_imgs_txt) | mkbuild-doc
	makeinfo --plain -I "$(PATH_DOC)" "${PATH_MANUAL_TEXI}" > $@

# doc html (multiple pages)
$(PATH_DOC_OUTPUT_HTML)/index.html: $(doc_src) \
| $(PATH_DOC_OUTPUT_HTML)/img $(PATH_DOC_OUTPUT_HTML)/interactive.js \
mkbuild-doc doc-img
	makeinfo --html --css-include="${PATH_DOC_CSS}" \
		-I "$(PATH_DOC)" -o "${PATH_DOC_OUTPUT_HTML}" "${PATH_MANUAL_TEXI}"
	sed -i '$(doc_replace)' $(PATH_DOC_OUTPUT_HTML)/*.htm?

# doc html (single page)
$(PATH_DOC_OUTPUT_HTML1): $(doc_src) \
| $(PATH_DOC_OUTPUT)/img $(PATH_DOC_OUTPUT)/interactive.js mkbuild-doc doc-img
	makeinfo --no-split --html --css-include="${PATH_DOC_CSS}" \
		-I "$(PATH_DOC)" -o - "${PATH_MANUAL_TEXI}" \
		| sed '$(doc_replace)' \
			> "$(PATH_DOC_OUTPUT_HTML1)"

# doc images (in build dir)
$(PATH_DOC_OUTPUT)/img: $(doc_imgs) | mkbuild-doc doc-img
	mkdir -p $@
	cp "$(PATH_DOC_IMG)"/*.png $@
$(PATH_DOC_OUTPUT_HTML)/img: $(PATH_DOC_OUTPUT)/img
	mkdir -p $(PATH_DOC_OUTPUT_HTML)
	ln -s ../img $@

# interactive html doc (js)
$(PATH_DOC_INTERACTIVE_DEST): $(PATH_DOC_INTERACTIVE_SRC)
	cp $< $@

doc-img: $(doc_imgs)
doc-pdf: $(PATH_DOC_OUTPUT)/manual.pdf
doc-info: $(PATH_DOC_OUTPUT_INFO)
doc-plain: $(PATH_DOC_OUTPUT_PLAIN)
doc-html: $(PATH_DOC_OUTPUT_HTML)/index.html $(PATH_DOC_OUTPUT_HTML1)

min: build/ease.min.js build/ease-full.min.js
build/%.min.js: build/%.js
	cat $(PATH_TOOLS)/license.tpl > $@
	node $(PATH_TOOLS)/minify.js < $< >> $@

install: all
	[ -d $(path_info_install) ] || mkdir -p $(path_info_install)
	cp $(PATH_DOC_OUTPUT_INFO) $(path_info_install)

uninstall:
	rm $(path_info_install)/easejs.info

# clean up build dir
clean:
	rm -rf "${PATH_BUILD}"
	rm -rf $(PATH_DOC_IMG)/*.png

