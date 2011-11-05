
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
