##
# ease.js website Makefile
#
# Builds ease.js website (dynamically generated static content)
#
#  Copyright (C) 2010 Mike Gerwitz
#
#  This file is part of the ease.js website.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU Affero General Public License as
#  published by the Free Software Foundation, either version 3 of the
#  License, or (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU Affero General Public License for more details.
#
#  You should have received a copy of the GNU Affero General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
##

header      := includes/header.html
footer      := includes/footer.html
header_news := includes/news-header.html

input_html := $(wildcard *.html)
input_images := $(wildcard images/*.png)
input_scripts := $(shell find scripts/ -name '*.js')

outdir := webroot
output_html := $(addprefix $(outdir)/, $(input_html))
output_images := $(addprefix $(outdir)/, $(input_images))
output_scripts := $(addprefix $(outdir)/, $(input_scripts))

.PHONY: default clean news publish

default: $(outdir) $(output_html) $(output_images) \
         $(output_scripts) $(outdir)/style.css

$(outdir):
	mkdir -p $@ $@/images $@/scripts/ex

$(outdir)/style.css: style.css | $(outdir)
	cp $< $@

$(outdir)/scripts/%.js: scripts/%.js | $(outdir)
	cp -r $< $@

$(outdir)/images/%.png: images/%.png | $(outdir)
	cp -r $< $@

$(outdir)/%.html: %.html $(header) $(footer) tools/page-parse | $(outdir)
	cat $(header) \
		| sed 's/\(<body\)/\1 class="$*"/' \
		| cat - $< $(footer) \
		| sed 's/^ \+//;s/^ *#//;' \
		| tools/page-parse \
		> $@

# requires git-weblog from mikegerwitz's git-supp package
news:
	@[ "$$( which git-weblog )" ] \
		|| ( echo "Please add git-weblog to PATH" >&2 && false )
	git fetch origin refs/notes/*:refs/notes/*
	git log --log-size --format="%H%n%B" master \
		| grep -A1 '^log size \([5-9][0-9]\{2,\}\|[0-9]\{4,\}\)$$' \
		| grep -o '^[a-z0-9]\+$$' \
		| xargs git weblog -Dn $$( git tag -l ) \
		| cat $(header) $(header_news) - $(footer) \
		| sed 's/\(<body\)/\1 class="news"/' \
		> "$(outdir)/news.html"

# documentation, styled to match the rest of the website
webdoc:
	./tools/webdoc

# publish webroot to remote server using rsync (do not delete files, since we
# may not have built everything)
publish: | default
	@[ -n "$(PUBROOT)" ] || ( echo "PUBROOT not set; aborting." >&2 && false )
	rsync -vrL $(outdir)/./* "$(PUBROOT)"

clean:
	${RM} -r webroot
