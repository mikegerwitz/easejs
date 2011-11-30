# documentation

path_doc=.
path_build=../build
path_lib=../lib
path_doc_output=${path_build}/doc
path_doc_output_info=${path_doc_output}/easejs.info
path_doc_output_plain=${path_doc_output}/manual.txt
path_doc_output_html=${path_doc_output}/manual
path_doc_output_html1=${path_doc_output}/manual.html
path_doc_css=${path_doc}/manual.css
path_doc_img=${path_doc}/img
path_doc_css_ref=manual.css
path_manual_texi=${path_doc}/manual.texi

path_info_install := /usr/local/share/info

doc_src := $(wildcard $(path_doc)/*.texi)
doc_imgs := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.dia))
doc_imgs_txt := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.txt))

doc_replace := s/<\/body>/<script type="text\/javascript" \
	src="highlight.pack.js"><\/script><script type="text\/javascript" \
	src="interactive.js"><\/script><\/body>/\
	;s/\&gt\;=/\&\#8805\;/g\
	;s/\&lt\;=/\&\#8804\;/g\

.PHONY: doc mkbuild-doc img pdf info plain html

# generate texinfo documentation (twice to generate TOC), then remove the extra
# files that were generated
#
# generates: pdf, info, HTML (multiple pages), HTML (single page)
default: pdf info plain html

mkbuild-doc: $(path_doc_output)

$(path_doc_output):
	[ -d $(path_doc_output) ] || mkdir -p "$(path_doc_output)"

# doc images
$(path_doc)/img/%.png: $(path_doc)/img/%.dia
	echo "$<" | grep -q 'wide' \
		&& dia -e $@ -s x250 $< \
		|| dia -e $@ -s 300x $<

# doc pdf
$(path_doc_output)/%.pdf: $(doc_src) $(doc_imgs) | mkbuild-doc img
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
$(path_doc_output_html)/index.html: $(doc_src) $(path_doc_css) \
| $(path_doc_output_html)/img $(path_doc_output_html)/interactive.js \
$(path_doc_output_html)/highlight.pack.js \
$(path_doc_output_html)/$(path_doc_css_ref) mkbuild-doc img
	makeinfo --html --css-ref="$(path_doc_css_ref)" \
		-I "$(path_doc)" -o "${path_doc_output_html}" "${path_manual_texi}"
	sed -i '$(doc_replace)' $(path_doc_output_html)/*.htm?

# doc html (single page)
$(path_doc_output_html1): $(doc_src) $(path_doc_css) \
| $(path_doc_output)/img $(path_doc_output)/interactive.js \
$(path_doc_output)/highlight.pack.js mkbuild-doc img
	makeinfo --no-split --html --css-include="${path_doc_css}" \
		-I "$(path_doc)" -o - "${path_manual_texi}" \
		| sed '$(doc_replace)' \
			> "$(path_doc_output_html1)"

# doc images (in build dir)
$(path_doc_output)/img: $(doc_imgs) | mkbuild-doc img
	[ -d "$@" ] || mkdir -p $@
	cp "$(path_doc_img)"/*.png $@
$(path_doc_output_html)/img: $(path_doc_output)/img
	mkdir -p $(path_doc_output_html)
	ln -s ../img $@

# interactive html doc (js)
$(path_doc_output_html)/%.js: $(path_doc)/%.js
	cp $< $@
$(path_doc_output)/%.js: $(path_doc)/%.js
	cp $< $@

# doc css
$(path_doc_output_html)/%.css: $(path_doc)/%.css
	cp $< $@


img: $(doc_imgs)
pdf: $(path_doc_output)/manual.pdf
info: $(path_doc_output_info)
plain: $(path_doc_output_plain)
html: $(path_doc_output_html)/index.html $(path_doc_output_html1)

clean:
	rm -rf $(path_doc_output)
	rm -rf $(path_doc_img)/*.png

