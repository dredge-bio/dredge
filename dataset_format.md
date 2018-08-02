Datasets must follow the following directory structure:

## ./README

A file containing information about the project


## ./LICENSE

A file with information about the license for the project

And citation information


## ./samples.json

A file describing the different samples used in the project

- Labels

- Mapping of keys (Only for internal usage to work with the embryo guy)


## ./gene\_names.json

A file providing alternate names for genes

<http://intermine.wormbase.org/tools/wormmine/begin.do>


## ./pairwise\_tests/

A directory containing pairwise tests between different samples. Each file should have the name formatted as `SAMPLE-A-KEY_SAMPLE-B-KEY.csv`. This file should be the `table` attribute of the output of the edgeR `exactTest` command. So, a comparison between two samples, one with the key `GSM16423` and one with the key `GSM16235` would be stored in the file `./pairwise_tests/GSM16423_GSM16235.csv`.
