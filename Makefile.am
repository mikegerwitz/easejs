## ease.js Makefile.am
#
#  Copyright (C) 2013, 2014 Free Software Foundation, Inc.
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

path_build = $(top_builddir)/build
path_tools = $(top_builddir)/tools
path_lib   = $(top_builddir)/lib
path_test  = $(top_builddir)/test
path_doc   = $(top_builddir)/doc

path_combine_output      = $(path_build)/ease.js
path_combine_output_full = $(path_build)/ease-full.js
path_browser_test        = $(path_tools)/browser-test.html

path_combine_output_min      = $(path_combine_output:.js=.min.js)
path_combine_output_full_min = $(path_combine_output_full:.js=.min.js)

src_js                = @SRC_JS@
path_externs_internal = $(path_build)/externs-internal.js

test_cases=$(shell cd test/ && find . -name '*Test.*' | tr '\n' ' ' )
src_tests=$(shell find test/ -name test-* | tr '\n' ' ' )

combine  = $(path_tools)/combine
compiler = @CCJAR@
MKDIR_P = @MKDIR_P@

# see README
SUBDIRS = doc
EXTRA_DIST = AUTHORS NEWS ChangeLog README.md README.hacking README.traits \
             lib test index.js package.json version \
             $(path_combine_output) $(path_combine_output_full) \
             $(path_browser_test) $(path_combine_output_min) \
             $(path_combine_output_full_min) \
             tools/combine tools/mkexterns tools/rmtrail \
             tools/signchk tools/browser-test.html tools/combine-order.js \
             tools/combine-test.tpl tools/combine.tpl tools/externs-global.js \
             tools/externs.js tools/license-min.tpl tools/license.tpl \
             tools/linechk-ignores tools/vergen

.PHONY: mkbuild combine min doc check test test-suite perf FORCE

default: combine

mkbuild: $(path_build)

# create build dir
$(path_build):
	$(MKDIR_P) "$(path_build)"


combine: reconf $(path_combine_output) $(path_build)/browser-test.html

# will force a reconfigure (for version data) if in the git repo
reconf:
	test -d .git && autoconf && ./configure

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
		--language_in=ECMASCRIPT5_STRICT \
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
html-single:
	$(MAKE) -C "$(path_doc)" html-single

test: check
check: $(src_tests) test-suite

# performance tests (order matters here)
perf-html: perf.log.html
perf.%.html: perf.%
	sort "$<" | $(path_tools)/perf2html -F\| > "$@"
perf: perf.log
perf.%: FORCE
if HAS_NODE
	@$(path_test)/perf/runner @PERF_TESTS@ > "$@"
else
	@echo "Node.js must be installed in order to run performance tests"
	@exit 1
endif

# non-JS test cases
test/test-%: FORCE
	./"$@"

# JS test cases
test-suite:
if HAS_NODE
	@echo "GNU ease.js Test Suite"
	@echo
	@(cd $(path_test) && ./runner $(test_cases))
else
	@echo "Node.js must be installed in order to run the test suite"
	@exit 1
endif

# generate the familiar files that automake normally checks for
dist-hook: AUTHORS NEWS ChangeLog version
	cp $? $(distdir)
AUTHORS: FORCE
	$(path_tools)/gitlog-to-authors > $@
NEWS: FORCE
	$(path_tools)/gitlog-to-news $(path_tools)/news-ignore > $@
ChangeLog: FORCE
	$(path_tools)/gitlog-to-changelog \
		--strip-cherry-pick \
		--format=%s \
		-- \
		--no-merges \
		> $@
# we *only* want this in a distribution, otherwise the version number will
# never change!
version: FORCE
	$(path_tools)/vergen > $@

clean-local:
	-rm -rf "$(path_build)"
	-rm -rf doc-cp  # created by website branch build
	-rm -f AUTHORS NEWS ChangeLog version

distclean-local:
	-rm -f package.json

maintainer-clean-local:
	-rm -f "$(compiler)"
