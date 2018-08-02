Datasets must follow the following directory structure:

## ./README

A file containing information about the dataset


## ./LICENSE

A file with information about the license for the dataset


## ./samples.json

A file describing the different samples tested in the dataset


## ./gene\_names.json

A file providing alternate names for genes


## ./pairwise\_tests/

A directory containing pairwise tests between different samples. Each file should have the name formatted as `SAMPLE-A-LABEL_SAMPLE-B-LABEL.csv`. This file should be the `table` attribute of the output of the edgeR `exactTest` command. So, a comparison between two samples, one labeled `Day1` and one labeled `GSM16423` and one labeled `GSM16235` would be stored in the file `./pairwise_tests/GSM16423_GSM16423.csv`.
