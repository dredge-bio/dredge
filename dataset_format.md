Datasets must follow the following directory structure:

## ./README

A file containing information about the project


## ./LICENSE

A file with information about the license for the project

And citation information


## ./treatments.json

A file describing the different treatments used in the project. This should describe, for each treatment:

  - The label by which it should be described

  - The keys for each of its replicates

  - The key which should be used to retrieve pairwise comparison files (Only for internal usage to work with the embryo guy)

The JSON file must be an object whose keys are the unique identifiers are treatments, and whose corresponding values must be objects with zero or more of strings corresponding to these keys: `label`, `file_identifier`.


## ./gene\_names.json

A file providing alternate names for genes

<http://intermine.wormbase.org/tools/wormmine/begin.do>


## ./pairwise\_tests/

A directory containing pairwise tests between different treatments. Each file should have the name formatted as `TREATMENT-A-KEY_TREATMENT-B-KEY.csv`. This file should be the `table` attribute of the output of the edgeR `exactTest` command. So, a comparison between two treatments, one with the key `GSM16423` and one with the key `GSM16235` would be stored in the file `./pairwise_tests/GSM16423_GSM16235.csv`.
