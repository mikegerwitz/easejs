# Builds website
#

header := includes/header.html
footer := includes/footer.html

input_html := $(wildcard *.html)
input_images := $(wildcard images/*.png)
input_scripts := $(shell find scripts/ -name '*.js')

outdir := webroot
output_html := $(addprefix $(outdir)/, $(input_html))
output_images := $(addprefix $(outdir)/, $(input_images))
output_scripts := $(addprefix $(outdir)/, $(input_scripts))

.PHONY: default clean blog publish

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

$(outdir)/%.html: %.html $(header) $(footer) | $(outdir)
	cat $(header) \
		| sed 's/\(<body\)/\1 class="$*"/' \
		| cat - $< $(footer) \
		| sed 's/^ \+//;s/^ *#//;' \
		| tools/page-parse \
		> $@

# requires git-weblog from mikegerwitz's git-supp package
blog:
	@[ "$$( which git-weblog )" ] \
		|| ( echo "Please add git-weblog to PATH" >&2 && false )
	git fetch origin refs/notes/*:refs/notes/*
	git log --log-size --format="%H%n%B" master \
		| grep -A1 '^log size \([5-9][0-9]\{2,\}\|[0-9]\{4,\}\)$$' \
		| grep -o '^[a-z0-9]\+$$' \
		| xargs git weblog -Dn $$( git tag -l ) \
		| cat $(header) - $(footer) \
		| sed 's/\(<body\)/\1 class="blog"/' \
		> "$(outdir)/blog.html"

# publish webroot to remote server using rsync (do not delete files, since we
# may not have built everything)
publish: | default
	@[ -n "$(PUBROOT)" ] || ( echo "PUBROOT not set; aborting." >&2 && false )
	rsync -vr $(outdir)/./* "$(PUBROOT)"

clean:
	${RM} -r webroot
