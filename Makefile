
path_build=./build
path_tools=./tools
path_lib=./lib
path_combine_output=${path_build}/ease.js
path_combine_output_full=${path_build}/ease-full.js
path_browser_test=${path_tools}/browser-test.html
path_test=./test
path_perf_test=${path_test}/perf

perf_tests := $(shell find "$(path_perf_test)" -name 'perf-*.js')

path_doc=./doc
path_doc_output=${path_build}/doc
path_doc_output_info=${path_doc_output}/easejs.info
path_doc_output_plain=${path_doc_output}/manual.txt
path_doc_output_html=${path_doc_output}/manual
path_doc_output_html1=${path_doc_output}/manual.html
path_doc_css=${path_doc}/manual.css
path_doc_img=${path_doc}/img
path_doc_interactive_src=$(path_doc)/interactive.js
path_doc_interactive_dest=$(path_doc_output)/interactive.js \
	$(path_doc_output_html)/interactive.js
path_manual_texi=${path_doc}/manual.texi

path_info_install := /usr/local/share/info

src_js := index.js $(wildcard $(path_lib)/*.js)
src_tests := index.js $(wildcard $(path_test)/test-*)
doc_src := $(wildcard $(path_doc)/*.texi)
doc_imgs := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.dia))
doc_imgs_txt := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.txt))

doc_replace := s/<\/body>/<script type="text\/javascript" \
	src="interactive.js"><\/script><\/body>/

combine=${path_tools}/combine


.PHONY: combine min doc test test-combine


default: combine min
all:     combine min doc

# create build dir
$(path_build):
	mkdir -p "$(path_build)"
$(path_doc_output):
	mkdir -p "$(path_doc_output)"
mkbuild: $(path_build)
mkbuild-doc: $(path_doc_output)

# combine all modules into easily redistributable ease.js file (intended for
# browser)
$(path_combine_output): $(src_js) | mkbuild
	${combine} > "$(path_combine_output)"
$(path_combine_output_full): $(src_js) $(src_tests) | mkbuild
	INC_TEST=1 "$(combine)" > "${path_combine_output_full}"
$(path_build)/browser-test.html: $(path_combine_output_full)
	cp "$(path_browser_test)" "$(path_build)"
combine: $(path_combine_output) $(path_build)/browser-test.html


test: default
	$(MAKE) -C $(path_test)

# performance tests
perf: default $(perf_tests)
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
$(path_doc_output)/%.pdf: $(doc_src) $(doc_imgs) | mkbuild-doc doc-img
	TEXINPUTS="$(path_doc):" \
		pdftex -output-directory "${path_doc}" "${path_manual_texi}" && \
		TEXINPUTS="$(path_doc):" \
		pdftex -output-directory "${path_doc}" "${path_manual_texi}"
	mv -f "${path_doc}"/*.pdf "${path_doc_output}"
	cd "$(path_doc)" && rm -f $(shell cat "$(path_doc)/.gitignore")

# doc info
$(path_doc_output_info): $(doc_src) $(doc_imgs_txt) | mkbuild-doc
	makeinfo -I "$(path_doc)" -o $@ "$(path_manual_texi)";

# doc plain text
$(path_doc_output_plain): $(doc_imgs_txt) | mkbuild-doc
	makeinfo --plain -I "$(path_doc)" "${path_manual_texi}" > $@

# doc html (multiple pages)
$(path_doc_output_html)/index.html: $(doc_src) \
| $(path_doc_output_html)/img $(path_doc_output_html)/interactive.js \
mkbuild-doc doc-img
	makeinfo --html --css-include="${path_doc_css}" \
		-I "$(path_doc)" -o "${path_doc_output_html}" "${path_manual_texi}"
	sed -i '$(doc_replace)' $(path_doc_output_html)/*.htm?

# doc html (single page)
$(path_doc_output_html1): $(doc_src) \
| $(path_doc_output)/img $(path_doc_output)/interactive.js mkbuild-doc doc-img
	makeinfo --no-split --html --css-include="${path_doc_css}" \
		-I "$(path_doc)" -o - "${path_manual_texi}" \
		| sed '$(doc_replace)' \
			> "$(path_doc_output_html1)"

# doc images (in build dir)
$(path_doc_output)/img: $(doc_imgs) | mkbuild-doc doc-img
	mkdir -p $@
	cp "$(path_doc_img)"/*.png $@
$(path_doc_output_html)/img: $(path_doc_output)/img
	mkdir -p $(path_doc_output_html)
	ln -s ../img $@

# interactive html doc (js)
$(path_doc_interactive_dest): $(path_doc_interactive_src)
	cp $< $@

doc-img: $(doc_imgs)
doc-pdf: $(path_doc_output)/manual.pdf
doc-info: $(path_doc_output_info)
doc-plain: $(path_doc_output_plain)
doc-html: $(path_doc_output_html)/index.html $(path_doc_output_html1)

min: build/ease.min.js build/ease-full.min.js
build/%.min.js: build/%.js
	cat $(path_tools)/license.tpl > $@
	node $(path_tools)/minify.js < $< >> $@

install: all
	[ -d $(path_info_install) ] || mkdir -p $(path_info_install)
	cp $(path_doc_output_info) $(path_info_install)

uninstall:
	rm $(path_info_install)/easejs.info

# clean up build dir
clean:
	rm -rf "${path_build}"
	rm -rf $(path_doc_img)/*.png

