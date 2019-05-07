###############
#  Variables  #
###############

PROJECT_NAME := dredge

NPM_BIN := node_modules/.bin

VERSION := $(shell git describe --abbrev=0 | cut -c 2-)

JS_BUNDLE = dist/$(PROJECT_NAME).js
VERSIONED_JS_BUNDLE = $(JS_BUNDLE:.js=-$(VERSION).js)
MINIFIED_VERSIONED_JS_BUNDLE = $(VERSIONED_JS_BUNDLE:.js=.min.js)

VERSIONED_DIRECTORY = dist/$(PROJECT_NAME)-$(VERSION)
VERSIONED_ZIPFILE = $(VERSIONED_DIRECTORY).zip

BROWSERIFY_ENTRY = src/index.js
BROWSERIFY_PREAMBLE = ZIP_FILENAME=$(notdir $(VERSIONED_ZIPFILE))

JS_FILES = $(shell find src/ -type f -name *js)
LIB_FILES = $(shell find lib/ -type f)
R_FILES = $(shell find r-scripts/ -type f)

TEST_FILES := $(shell find test -name '*.js')

ZIPPED_FILES = $(VERSIONED_JS_BUNDLE) \
	       $(MINIFIED_VERSIONED_JS_BUNDLE) \
	       $(LIB_FILES) \
	       $(R_FILES) \
	       favicon.ico \
	       index.html


###################
#  Phony targets  #
###################

all: node_modules $(MINIFIED_VERSIONED_JS_BUNDLE)

watch: | dist
	$(BROWSERIFY_PREAMBLE) $(NPM_BIN)/watchify -v -d -o $(JS_BUNDLE) $(BROWSERIFY_ENTRY)

zip: $(VERSIONED_ZIPFILE)

serve:
	python3 -m http.server 9999

test:
	@$(NPM_BIN)/blue-tape $(TEST_FILES)

clean:
	rm -rf dist
	rm -rf node_modules

.PHONY: all watch zip serve test clean


#############
#  Targets  #
#############

dist:
	mkdir -p $@

node_modules: package.json
	npm install

$(VERSIONED_JS_BUNDLE): $(JS_FILES) | dist
	$(BROWSERIFY_PREAMBLE) NODE_ENV=production $(NPM_BIN)/browserify -d $(BROWSERIFY_ENTRY) -o $@

$(MINIFIED_VERSIONED_JS_BUNDLE): $(VERSIONED_JS_BUNDLE)
	$(NPM_BIN)/terser $< -o $@ --compress

$(VERSIONED_ZIPFILE): $(ZIPPED_FILES) | dist
	@rm -f $@
	mkdir -p $(VERSIONED_DIRECTORY)
	cp $^ $(VERSIONED_DIRECTORY)
	cd $(VERSIONED_DIRECTORY) && mkdir lib && mv $(notdir $(LIB_FILES)) lib
	cd $(VERSIONED_DIRECTORY) && mkdir r-scripts && mv $(notdir $(R_FILES)) r-scripts
	sed -i \
		-e 's|$(JS_BUNDLE)|$(notdir $(MINIFIED_VERSIONED_JS_BUNDLE))|' \
		$(VERSIONED_DIRECTORY)/index.html
	cd dist && zip -r $(notdir $@) $(notdir $(VERSIONED_DIRECTORY))
	rm -rf $(VERSIONED_DIRECTORY) $(VERSIONED_JS_BUNDLE) $(MINIFIED_VERSIONED_JS_BUNDLE)
