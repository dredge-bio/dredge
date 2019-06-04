<!-- baseURL -->

The directory where you will save the configuration file generated from this page, relative to the `index.html` file for your DrEdGE project. All of the following settings involving URLs will be resolved relative to this directory.

This URL can be relative or absolute, but note that if data will be served from a different host than the DrEdGE page, you will need to set appropriate [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) on that host.


<!-- expressionMatrix -->
The URL of the file containing abundance measures for each transcript by each replicate. The format of this file is described in the instructions to the right.


<!-- treatments -->

The URL of the JSON file describing each treatment in the dataset. If you have this information in a table, you can convert it to a JSON using the R script described in the instructions to the right. If you choose to generate them on your own, the JSON file should have the following characteristics:

The whole file must be one JSON object whose keys are the unique treatment identifiers, and whose values contain an object with two properties: `label` (the human-readable label for the treatment), and `replicates` (an array of strings giving identifiers for the different replicates for the treatment). The replicate identifiers should be identical to those provided in the transcript abundance matrix above.


<!-- pairwiseName -->

A template to generate the URLs to each pairwise comparison data table. The characters \'%A\' and \'%B\' will be replaced by pairs of treatment identifiers. For example: If treatments T1 and T2 are compared in a table called `T1-T2.csv`, in the directory `pairwise_tests/`, the value in this field should be `pairwise_tests/%A-%B.csv`.

DrEdGE expects a pre-generated file for each pairwise comparison of treatments. Instructions for how to generate these files using our edgeR workflow can be found to the right, though you may use a different statistical method if you prefer. DrEdGE will expect that each comparison file is a tab-separated value with four columns in the following order: transcript name, log₂ Fold Change, log₂ Reads per Million (or similarly normalized abundance values), and p-value. The first row will be discarded as a header. The transcript names must match those found in the transcript abundance matrix.

If you generate your own statistical tables (rather than using our R script), make sure the signs in front of the logFC values are correct. Some programs (such as DESeq2) define fold change as treatment1/treatment2, resulting in a negative logFC if abundance is greater in treatment 2, while other programs (such as edgeR) use the reciprocal, resulting in a positive logFC. DrEdGE expects the latter convention.


<!-- maPlot -->

The limits for the X and Y axes on the MA Plot. Set these to values such that all of the data from your pairwise comparisons will fall within the plot. If you used our R script to generate your pairwise comparison files, a min_max report will have been automatically be generated (see instructions to the right).


<!-- transcriptAliases -->

The URL of a file with alternate names for transcripts in the dataset. This should be a CSV file whose first column contains the most human-legible transcript name, and whose other columns contain alternate names, codes, synonyms, IDs. One of these names must be a transcript identifier used in the transcript abundance matrix and the pairwise comparison files.


<!-- readme -->

A URL to a [Markdown](https://commonmark.org/help/) file that provides information about your project.


<!-- transcriptHyperlink -->

A hyperlink pointing to an external database website, for more information about a given transcript. The label should be the name of the database, and the URL should be the template to generate a hyperlink. The string `%name` in the URL will be replaced with the name of a given transcript. For example, given a URL template with the value `http://example.com/biobase/gene/search/%name` and a transcript with the name `act-1`, the URL to get more information about the transcript would be `http://example.com/biobase/gene/search/act-1` .


<!-- diagram -->

The URL of an SVG diagram of treatments in this project. This will generate a graphic that allows users to visually select treatments to compare. It will also generate an illustrated heat map of transcript abundance among all treatments in the project. To link objects in the SVG to treatments in your project, set the `id` attribute of the SVG shape (e.g. `rect`, `circle`, `polygon`) to the corresponding treatment identifier.


<!-- grid -->

The URL to a table of values containing the names of treatment identifiers. If the file contains tabs, it will be parsed as a TSV, otherwise it will be parsed as a CSV. This table will be used to create a graphic heat map of transcript abundances across treatments. If left blank, a default grid will be generated.


<!-- heatmapMinimumMaximum -->

The two URLs above create heat maps for each transcript, with a color scale ranging from 0 to the maximum abundance of a transcript across all treatments. This value sets a minimum range for that color scale. For example, a value of 50 will ensure that the darkest color on the heatmap is never assigned to less than 50, even if transcript abundance only goes up to 8.
