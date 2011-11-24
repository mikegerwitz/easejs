# Builds website
#

header := _includes/header.html
footer := _includes/footer.html

input_html := $(wildcard *.html)
input_images := $(wildcard images/*.png)
input_scripts := $(shell find scripts/ -name '*.js')

outdir := webroot
output_html := $(addprefix $(outdir)/, $(input_html))
output_images := $(addprefix $(outdir)/, $(input_images))
output_scripts := $(addprefix $(outdir)/, $(input_scripts))

.PHONY: default clean

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
		| sed 's/^ \+//' \
		> $@

clean:
	${RM} -r webroot
