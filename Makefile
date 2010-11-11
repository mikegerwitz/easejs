
.PHONY: test

test:
	for test in `find ./test -name 'test-*.js'`; do \
		node $${test}; \
	done
