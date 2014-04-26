# ease.js manual Makefile
#
# Responsible for building the project documentation.
#
#  Copyright (C) 2010, 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
#
#  This file is part of GNU ease.js.
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
easejs_TEXINFOS = license.texi about.texi classes.texi interop.texi \
impl-details.texi integration.texi mkeywords.texi source-tree.texi

EXTRA_DIST = img README highlight.pack.js interactive.js easejs.css

path_build=../build
path_lib=../lib
docdir = @docdir@
path_doc_output_plain=easejs.txt
path_doc_output_html=easejs.html
path_doc_output_html1=easejs-single.html
path_doc_css=easejs.css
path_doc_img=img
path_easejs_texi=easejs.texi
path_doc_css_ref=$(path_doc_css)

MAKEINFOHTML=$(MAKEINFO) --html --css-ref="$(path_doc_css_ref)"

doc_src := $(wildcard *.texi)
doc_imgs := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.dia))
doc_imgs_txt := $(patsubst %.dia, %.png, $(wildcard $(path_doc_img)/*.txt))

doc_replace := s/<\/body>/<script type="text\/javascript" \
	src="highlight.pack.js"><\/script><script type="text\/javascript" \
	src="interactive.js"><\/script><\/body>/\
	;s/\&gt\;=/\&\#8805\;/g\
	;s/\&lt\;=/\&\#8804\;/g

.PHONY: doc mkbuild-doc img info html

mkbuild-doc: $(path_doc_output)

dvi-local: img
pdf-local: img
html-local: img easejs.css highlight.pack.js interactive.js

# doc images
img/%.png: img/%.dia
	echo "$<" | grep -q 'wide' \
		&& dia -e $@ -s x250 $< \
		|| dia -e $@ -s 300x $<

# doc plain text
$(path_doc_output_plain): $(doc_imgs_txt)
	makeinfo --plain -I "." "${path_easejs_texi}" -o "$@"

# doc html (multiple pages); override default target to call automake's
# first and then post-process output (it has no *-hook target support)
html: html-local html-am $(path_doc_output_html)/$(path_doc_css_ref)
	sed -i '$(doc_replace)' easejs.html/*.htm?

# doc html (single page)
html-single: $(path_doc_output_html1)
$(path_doc_output_html1): html-local
	$(MAKEINFO) --no-split --html --css-include="${path_doc_css}" \
		-I . -o "$(path_doc_output_html1)" "${path_easejs_texi}" \
		&& sed -i '$(doc_replace)' "$(path_doc_output_html1)"

# doc images (in build dir)
$(path_doc_output)/img: $(doc_imgs) | mkbuild-doc img
	[ -d "$@" ] || mkdir -p $@
	cp "$(path_doc_img)"/*.png $@
$(path_doc_output_html)/img: $(path_doc_output)/img
	mkdir -p $(path_doc_output_html)
	ln -s ../img $@

# interactive html doc (js)
$(path_doc_output_html)/%.js: %.js
	cp $< $@
$(path_doc_output)/%.js: %.js
	cp $< $@

# doc css
$(path_doc_output_html)/%.css: %.css
	cp $< $@


img: $(doc_imgs)

plain: $(path_doc_output_plain)
install-plain: plain
	install -d $(DESTDIR)$(docdir)
	install -m644 $(path_doc_output_plain) \
		$(DESTDIR)$(docdir)/easejs.txt

clean-local:
	rm -rf $(path_doc_img)/*.png
	rm -f $(path_doc_output_plain)

