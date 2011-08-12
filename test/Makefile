
tests := $(shell find . \
	-name 'test-*' \
	-o -name '*Test.*' \
	-a ! -name 'test-combine*.js'\
)
tests_combine := test-combine*.js

.PHONY: FORCE test test-combine


default: $(tests) combine
combine: $(tests_combine)

%.js: FORCE
	node --stack_trace_limit=20 $@
test-%: FORCE
	./$@
