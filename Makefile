###############
#  Variables  #
###############

NPM_BIN=node_modules/.bin

VERSION := $(shell npm ls --depth=0 --long 2> /dev/null | head -n 1 | cut -d@ -f 2)

BROWSERIFY_ENTRY = src/index.js

JS_BUNDLE = dist/dredge.js
VERSIONED_JS_BUNDLE = $(JS_BUNDLE:.js=-$(VERSION).js)
MINIFIED_VERSIONED_JS_BUNDLE = $(VERSIONED_JS_BUNDLE:.js=.min.js)


VERSIONED_DIRECTORY = dredge-$(VERSION)
VERSIONED_ZIPFILE = dist/$(VERSIONED_DIRECTORY).zip

JS_FILES = $(shell find src/ -type f -name *js -o -name *jsx)
LIB_FILES = $(shell find lib/ -type f)

ZIPPED_FILES = $(MINIFIED_VERSIONED_JS_BUNDLE) \
	       $(LIB_FILES) \
	       LICENSE \
	       README.md \
	       favicon.ico \
	       index.html \
	       about.html


###################
#  Phony targets  #
###################

all: node_modules $(MINIFIED_VERSIONED_JS_BUNDLE)

zip: $(VERSIONED_ZIPFILE)

clean:
	rm -rf dist
	rm -rf node_modules

.PHONY: all zip clean


#############
#  Targets  #
#############

dist:
	mkdir -p $@

node_modules: package.json
	npm install

$(VERSIONED_JS_BUNDLE): $(JS_FILES) | dist
	NODE_ENV=production $(NPM_BIN)/browserify -d $(BROWSERIFY_ENTRY) > $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(NPM_BIN)/terser $< -o $@ --compress

$(VERSIONED_ZIPFILE): $(ZIPPED_FILES) | dist
	@rm -f $@
	cp index.html dist/index.html
	sed -i \
		-e 's|$(JS_BUNDLE)|$(MINIFIED_VERSIONED_JS_BUNDLE)|' \
		dist/index.html
	zip $@ $^
	zip -j $@ dist/index.html
	rm dist/index.html
