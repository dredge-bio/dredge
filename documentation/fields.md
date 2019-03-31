<!-- baseURL -->

The directory where you will save the configuration file you generate from this page, relative to where you will place the `index.html` file when you upload your DrEdGE project. All of the following settings involving URLs will be resolved relative to this directory.

If you change this URL, it can be relative or absolute, But note that if data will be served from a different host than the DrEdGE page, you will need to set appropriate [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) on that host.


<!-- expressionMatrix -->
The URL of the file containing abundance measures for each transcript by treatement. The format of this file is described in the instructions to the right.


<!-- treatments -->

The URL that contains information about individual treatments in the dataset. Generating using R scripts as described in the instructions. This JSON file can be generated using provided R scripts using the instructions to the right, but if you choose to generate them on your own, the file should be JSON with the following characteristics:

The whole file must be one JSON object whose keys are the unique name of the treatments, and whose values contain an object with two properties: `label` (the human-readable label for the treatment), and `replicates` (an array of strings giving identifiers for the different replicates for the treatment. These identifiers should be identical to those provided in the gene expression matrix)


<!-- pairwiseName -->

A template to generate the URLs to pairwise comparison data. The characters \'%A\' will be replaced with the name of the first treatment, and \'%B\' the second. For example: If my dataset contained the pairwise comparison for treatments T1 and T2 in the directory `pairwise_tests/T1-T2.csv` the value in this field would be `pairwise_tests/%A-%B.csv`
),

DrEdGE expects a pre-generated file for each pairwise comparison of treatments containing statistics about the comparison for each different transcript. Instructions about how to generate this file using edgeR can be found to the right. You may use your own statistical package, but DrEdGE will expect that each comparison file will be a tab-separated value with the first four columns being: transcript name, log₂ Fold Change, log₂ Reads per Million, and p-value. The first row will be discarded asd a header. The name of the transcript should match those found in the gene expression matrix.


<!-- maPlot -->

The limits for the X and Y axes on the MA Plot. Set these to values such that all of the data from your pairwise comparisons will fall within the plot.


<!-- transcriptAliases -->

The URL that contains information about alternate names for transcripts in the dataset. This should be a CSV file whose first column contains the canonical label for a transcript, and whose other columns contain alternate names. One of these columns must contain a value found in the `treatment.id` column in the **project design file** described in the instructions.


<!-- readme -->

A URL to a [Markdown](https://commonmark.org/help/) file that provides information about this project.


<!-- transcriptHyperlink -->

A hyperlink that will point to an external website for more information about a given transcript. The label should be the name of the website, and the URL should be a template to generate a hyperlink. The string `%name` in the URL will be replaced with the name of a given transcript. For example, given a URL template with the value `http://example.com/biobase/gene/%name` and a transcript with the name `TGE144.2` the URL to get more information for the transcript would be `http://example.com/biobase/gene/TGE144.2` .


<!-- diagram -->

The URL of the SVG diagram for this project. This SVG will be a diagram that will allow users to select different treatments to compare and show a "heat map" of transcript abundances among different treatments. To identify treatments in your SVG, you should set the `id` attribute of the SVG shape (e.g. `path`, `rect`, `circle`) that corresponds to a given treatment. The value of the `id` attribute must be the same as the unique treatment identifier given in the treatment information file.
