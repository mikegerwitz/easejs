
tests := $(shell find . \
	-name 'test-*' \
	-a ! -name 'test-combine*.js'\
	-o -name '*Test.*' \
)
tests_combine := test-combine*.js

.PHONY: FORCE test test-combine


default: $(tests) combine
combine: $(tests_combine)

%.js: FORCE
	NODE_PATH=".:$(NODE_PATH)" node --stack_trace_limit=20 "$@"
test-%: FORCE
	./$@
