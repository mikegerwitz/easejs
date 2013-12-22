# ease.js manual Makefile
#
# Responsible for building the project documentation.
#
#  Copyright (C) 2011, 2012 Mike Gerwitz
#
#  This file is part of ease.js.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
##

info_TEXINFOS = easejs.texi
easejs_TEXINFOS = license.texi about.texi classes.texi              \
impl-details.texi integration.texi mkeywords.texi source-tree.texi

EXTRA_DIST = img README highlight.pack.js interactive.js easejs.css

path_doc=.
path_build=../build
path_lib=../lib
docdir = @docdir@
path_doc_output=${path_build}/doc
path_doc_output_plain=${path_doc_output}/easejs.txt
path_doc_output_html=${path_doc_output}/easejs
path_doc_output_html1=${path_doc_output}/easejs.html
path_doc_css=${path_doc}/easejs.css
path_doc_img=${path_doc}/img
path_doc_css_ref=easejs.css
path_easejs_texi=${path_doc}/easejs.texi

doc_src := $(wildcard $(path_doc)/*.texi)
doc_imgs := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.dia))
doc_imgs_txt := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.txt))

doc_replace := s/<\/body>/<script type="text\/javascript" \
	src="highlight.pack.js"><\/script><script type="text\/javascript" \
	src="interactive.js"><\/script><\/body>/\
	;s/\&gt\;=/\&\#8805\;/g\
	;s/\&lt\;=/\&\#8804\;/g

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
		pdftex -output-directory "${path_doc}" "${path_easejs_texi}" && \
		TEXINPUTS="$(path_doc):" \
		pdftex -output-directory "${path_doc}" "${path_easejs_texi}"
	mv -f "${path_doc}"/*.pdf "${path_doc_output}"
	cd "$(path_doc)" && rm -f $(shell cat "$(path_doc)/.gitignore")

# doc plain text
$(path_doc_output_plain): $(doc_imgs_txt) | mkbuild-doc
	makeinfo --plain -I "$(path_doc)" "${path_easejs_texi}" > $@

# doc html (multiple pages)
$(path_doc_output_html)/index.html: $(doc_src) $(path_doc_css) \
| $(path_doc_output_html)/img $(path_doc_output_html)/interactive.js \
$(path_doc_output_html)/highlight.pack.js \
$(path_doc_output_html)/$(path_doc_css_ref) mkbuild-doc img
	makeinfo --html --css-ref="$(path_doc_css_ref)" \
		-I "$(path_doc)" -o "${path_doc_output_html}" "${path_easejs_texi}"
	sed -i '$(doc_replace)' $(path_doc_output_html)/*.htm?

# doc html (single page)
$(path_doc_output_html1): $(doc_src) $(path_doc_css) \
| $(path_doc_output)/img $(path_doc_output)/interactive.js \
$(path_doc_output)/highlight.pack.js mkbuild-doc img
	makeinfo --no-split --html --css-include="${path_doc_css}" \
		-I "$(path_doc)" -o - "${path_easejs_texi}" \
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
pdf: $(path_doc_output)/easejs.pdf
install-pdf: pdf
	install -d $(DESTDIR)$(docdir)
	install -m644 $(path_doc_output)/easejs.pdf $(DESTDIR)$(docdir)/easejs.pdf

plain: $(path_doc_output_plain)
install-plain: plain
	install -d $(DESTDIR)$(docdir)
	install -m644 $(path_doc_output_plain) $(DESTDIR)$(docdir)/easejs.txt

html: $(path_doc_output_html)/index.html $(path_doc_output_html1)
install-html: html
	install -d $(DESTDIR)$(docdir)/easejs
	install -m644 $(path_doc_output_html)/index.html $(DESTDIR)$(docdir)/easejs/index.html
	install -m644 $(path_doc_output_html1) $(DESTDIR)$(docdir)/easejs.html

clean:
	rm -rf $(path_doc_output)
	rm -rf $(path_doc_img)/*.png

