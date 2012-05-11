##
# ease.js test Makefile
#
# Responsible for running the ease.js test suite.
#
#  Copyright (C) 2012  Mike Gerwitz
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

tests := $(shell find . \
	-name 'test-*' \
	-a ! -name 'test-combine*.js'\
)
cases := $(shell find . \
	-name '*Test.*' \
)
tests_combine := test-combine*.js

.PHONY: FORCE test test-combine suite


default: $(tests) suite combine
combine: $(tests_combine)

suite:
	@echo "ease.js Test Suite"
	@echo
	@NODE_PATH=".:$(NODE_PATH)" node --stack_trace_limit=20 runner.js ${cases}
%.js: FORCE
	NODE_PATH=".:$(NODE_PATH)" node --stack_trace_limit=20 "$@"
test-%: FORCE
	./$@
