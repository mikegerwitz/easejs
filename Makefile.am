## ease.js Makefile.am

# see README
SUBDIRS = doc
EXTRA_DIST = AUTHORS NEWS ChangeLog

path_build = $(top_builddir)/build
path_tools = $(top_builddir)/tools
path_lib   = $(top_builddir)/lib
path_test  = $(top_builddir)/test
path_doc   = $(top_builddir)/doc

path_perf_test           = $(path_test)/perf
path_combine_output      = $(path_build)/ease.js
path_combine_output_full = $(path_build)/ease-full.js
path_browser_test        = $(path_tools)/browser-test.html

src_js                = @SRC_JS@
perf_tests            = @PERF_TESTS@
path_externs_internal = $(path_build)/externs-internal.js

combine  = $(path_tools)/combine
compiler = @CCJAR@
MKDIR_P = @MKDIR_P@

.PHONY: mkbuild combine min doc test perf

default: all-local
all-local: combine min

mkbuild: $(path_build)

# create build dir
$(path_build):
	$(MKDIR_P) "$(path_build)"


combine: $(path_combine_output) $(path_build)/browser-test.html

# combine all modules into easily redistributable ease.js file (intended for
# browser)
$(path_combine_output): $(src_js) | mkbuild
	$(combine) > "$(path_combine_output)"
$(path_combine_output_full): $(src_js) $(src_tests) | mkbuild
	INC_TEST=1 "$(combine)" > "${path_combine_output_full}"
$(path_build)/browser-test.html: $(path_browser_test) | $(path_combine_output_full)
	cp -f "$(path_browser_test)" $@
$(path_build)/browser-test-min.html: $(path_browser_test) | $(path_combine_output_full)
	cat "$(path_browser_test)" | sed 's/ease-full\.js/ease-full\.min\.js/' > $@

# minification process uses Google Closure compiler
min: $(path_build)/ease.min.js $(path_build)/ease-full.min.js \
$(path_build)/browser-test-min.html | combine
build/%.min.js: build/%.js $(path_tools)/externs-global.js  $(path_externs_internal)
if HAS_JAVA
if HAS_CCJAR
	cat $(path_tools)/license-min.tpl > $@
	$(JAVA) -jar $(compiler) \
		--externs $(path_tools)/externs-global.js \
		--externs $(path_build)/externs-internal.js \
		--js $< >> $@ || rm $@
else
	@echo "cannot create $@:"
	@echo "  please download closure-compiler.jar and re-run ./configure"
	@exit 1
endif
else
	@echo "Please install a Java virtual machine (e.g. openjdk)"
	@exit 1
endif

# externs for compilation process
$(path_externs_internal): | mkbuild
	$(path_tools)/mkexterns > $@

doc:
	$(MAKE) -C "$(path_doc)"

test: check
check: default
	$(MAKE) -C "$(path_test)"

# performance tests
perf: default $(perf_tests)
perf-%.js: default
if HAS_NODE
	@$(NODE) $@
else
	@echo "Node.js must be installed in order to run performance tests"
	@exit 1
endif

# generate the familiar files that automake normally checks for
dist-hook:
	$(path_tools)/gitlog-to-authors > $(distdir)/AUTHORS
	$(path_tools)/gitlog-to-news > $(distdir)/NEWS
	$(path_tools)/gitlog-to-changelog \
		--strip-cherry-pick \
		--format=%s \
		-- \
		--no-merges \
		> $(distdir)/ChangeLog

clean-local:
	-rm -rf "$(path_build)"

maintainer-clean-local:
	-rm -f "$(compiler)"
