<!--
Variables which will be replaced:

%%VERSION%%          - The version number of DrEdGE (e.g. 5.1.3)

%%VERSION-PREFIXED%% - The prefixed version number (e.g. dredge-5.1.3) that will
                       be the basis of the DrEdGE directory and zip file.

%%ZIP-FILENAME%%     - The name of the zipfile for the current version of DrEdGE

%%PROJECT-DIR%%      - The directory in which the DrEdGE index.html file will live

%%PROJECT-DATA-DIR%% - The directory in which the project configuration files will live

-->
## Instructions

To add a new project based on your own dataset, first download a local copy of DrEdGE so that you can work will files on your own machine. This zip file contains all of the static files and R scripts needed to generate and serve files based on transcript measurements: [%%ZIP-FILENAME](%%ZIP_FILENAME)

### Setting up DrEdGE

You will need to serve this page via a local Web server on your own machine. If you have Python installed, this can be done by changing to the directory containing the file `index.html` and running `python3 -m http.server` (Python 3) or `python -m SimpleHTTPServer` (Python 2). These commands will serve DrEdGE on your own machine on port 8000. Add a number at the end of the command to change the default port number. Once you have your local application up and running, visit this page there. If you used the default port, this should be located at <http://localhost:8000/?page=configure> or <http://127.0.0.1:8000/?page=configure>.

Next, make a folder somewhere within your local dredge installation where you will keep project data. For this example, we'll assume it's called `data`, and that it is located in the folder `projectRoot`. Because we will put all of our project files in this directory, The **Configuration file directory** field to the left has been already filled out with the value `./data/`. You may change this value if you choose to put your configuration file in a different place.

DrEdGE itself does not calculate any statistics itself. Rather, it expects statistical calculations to be pre-calculated ahead of time in tab-separated files. The following give instructions for generating these files with R scripts maintained by the DrEdGE authors that use the [edgeR](https://doi.org/doi:10.18129/B9.bioc.edgeR) package. If you want to use your own methods for generating statistics, read the documentation for each field on the left.

To use our R scripts, you will need to have ready two different files: a **project design file**, which describes characteristics about the treatments and replicates in the dataset, and a gene expression matrix, which gives measurements of transcript abundance by each replicate.

The **project design file** is a tab-separated table with a header row and multiple rows representing each of the replicates in the dataset. The following columns must be present, and they must be labeled exactly as given below:

* **replicate.id**: A unique identifier for a replicate

* **treatment.id**: An identifier for the treatment that this replicate belongs to. (This will be used to combine different replicates in the same treatment)

* **treatment.name**: The label that will be used to render a human-readable name for the given treatment.

The **gene expression matrix** should be a tab-separated table with rows representing the abundance of a transcript in each replicate in the dataset. The header row should contain columns for every replicate in the dataset, and the first column should be a list of every transcript in the dataset. The top-leftmost cell of the table should be empty. This will look like:

```
      r1      r2      r3        r4
t1    32.2    24.3    6742.3    0.04
t2    43.1    44.1    5423.1    9.1
t3    19.1    100.2   661.9     5.4
t4    154.1   0.4     555.1     6.2`,
```

Where the abundance of t1 in r1 is 32.2, the abundance of t1 in r2 is 24.3, and so on.

Copy this file to the `%%PROJECT-DATA-DIR` directory, and record it in the **Gene Expression Matrix URL** field to the left. For this example, we will assume this file is called `%%PROJECT-DATA-DIR/expression_matrix.tsv`

### Generating DrEdGE data

Once these files are ready, you will be able to generate the files for **treatment information** and **pairwise comparisons** as well as the appropriate **MA Plot limits** for your project.

First, open a terminal and change directories to `%%PROJECT-DATA-DIR`. Then run the R script included in the zip file called `JSON_treatments.R`, using the command:

```
Rscript ../r-scripts/JSON_treatments.R -i experiment_design_file.tsv
```

By default, this will generate the file `%%PROJECT-DATA-DIR/treatments.json`, but you may change the location of the output file with the `-o` command line flag. Record the location of the output file in the field for **Treatment information URL**

Run the pairwise comparison generation script in much the same way, using the R script `pairwise_comparisons.R`:

```
Rscript ../r-scripts/pairwise_comparisons.R -i expression_matrix.tsv
```

This will generate a directory full of pairwise comparisons between different treatments. By default, the folder is `pairwise_files`, but this can be adjusted with the `-o` flag. This value should be recorded in the **Treatment information URL** field. The script will also create a file showing the minimum and maximum average transcript abundance. By default, this will be called `min_max.txt` but can be adjusted with the `-m` flag.

Once you have filled out the configuration on the left, press the "Test" button to see if your configuration loads appropriately. If you are satisfied, press the "Save" button, navigate to the `%%PROJECT-DATA-DIR%%` folder on your hard drive, and save the configuration file. By default, it will be called `project.json`, but you may change the name if you wish.

Now edit the `index.html` file and follow the instructions to point your project to the appropriate location of the configuration file, which sould be: `%%PROJECT-DATA-DIR%%/project.json`.

Restart DrEdGE by refreshing your browser window, and hopefully your project will be available.
