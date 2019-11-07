<!--
Variables which will be replaced:

%%VERSION%%          - The version number of DrEdGE (e.g. 5.1.3)

%%VERSION-PREFIXED%% - The prefixed version number (e.g. dredge-5.1.3) that will
                       be the basis of the DrEdGE directory and zip file.

%%ZIP-FILENAME%%     - The name of the zipfile for the current version of DrEdGE

%%PROJECT-DIR%%      - The directory in which the DrEdGE index.html file will live

%%PROJECT-DATA-DIR%% - The directory in which the project configuration files will live

-->

# Instructions

DrEdGE is an application for visualizing RNAseq data in a Web browser. It runs exclusively using static files stored on a file system, with no requirement of a database or server to run and store statistical analyses. This means that DrEdGE is easy to run and deploy, but it also means that you must create all the files needed for your project ahead of time. This guide will take you through the steps to create those files and configure DrEdGE to work with your own dataset.

We will follow along with a fully configured example located at <https://github.com/dredge-bio/example-dataset>. You can see how the example application looks at <https://dredge-bio.github.io/example-dataset/>. The example is a [subset of a dataset](https://www.ncbi.nlm.nih.gov/pubmed/27554860) of the transcriptional lineage of the <i>C. elegans</I> embryo, created by Sophia Tintori.

## Downloading

All of the JavaScript, HTML, and fonts required to run DrEdGE can be found in this zip archive: [%%ZIP-FILENAME%%](%%ZIP-FILENAME%%). To begin, download this zip file and extract it somewhere on your computer. Open the `index.html` file inside, and follow the instructions to set up a local Web server. Continue to configure DrEdGE on that local server.

## Overview

The form on the left will generate a configuration file, named `project.json`, that will tell DrEdGE where to find your project's files, and how to configure the DrEdGE interface. As you fill out the form, you can press the **Test** button to check if the configuration is working properly. Once you have gotten a good configuration, press the **Save** button, and save the `project.json` file to the directory where you extracted DrEdGE. (You can also load an existing `project.json` file into the form by using the **Load** button). Once you have saved the `project.json` file, you can access your DrEdGE application at %%THIS-URL%%.


# Basic configuration

You will need two files to start: a project design file that describes the treatments used in your dataset, and a transcript abundance table that has information about RNAseq measurements for each treatment replicate. We provide R scripts to generate DrEdGE configuration files based on these. They are located in the folder `%%PROJECT-DIR%%/r-scripts`.

## Project design file

The project design file should be a tab-separated table where each row represents a replicate in your dataset. The table can have any number of columns, but it the following three must be present:

  1. **replicate.id**: A unique codename given for the replicate

  2. **treatment.id**: A unique codename given to the treatment corresponding to the replicate

  3. **treatment.name**: A human-readable label given to the treatment defined with **treatment.id**. This is the text that will be shown around the DrEdGE interface to refer to treatments.

Example: https://github.com/dredge-bio/example-dataset/blob/master/project_design_file.tsv


In the example dataset, notice we have 3 different treatments, each of which have two replicates.

Save this file to the DrEdGE directory (for example, `%%PROJECT-DIR%%/project_design_file.tsv`), and then run the following R command in that folder:

```
Rscript ./r-scripts/JSON_treatments.R -i project_design_file.tsv
```

This will generate the file `treatments.json`, which is a JSON file that tells DrEdGE about the different treatments and replicates in your project. The **%%field-treatments%%** field on the left should point to this file. If you keep the default file name, you will not need to change anything.

Example: https://github.com/dredge-bio/example-dataset/blob/master/treatments.json


## Transcript abundance matrix

Next, we will configure the transcript abundance matrix and pairwise comparisons. You must provide a **gene expression matrix** file, a tab-separated table of normalized transcript abundance values. Each row in the table represents a unique transcript, and each column represents a replicate. The header row should contain replicate ID that match those in the **project design file**. The first column should be a list of every transcript in the dataset. The top-leftmost cell of the table should be empty.

Example: https://github.com/dredge-bio/example-dataset/blob/master/expression_matrix.tsv

Save this file to the DrEdGE directory and enter the filename into the **%%field-expressionMatrix%%** field on the left. Now we will run an R script to create pairwise comparisons between each treatment using the [edgeR](https://doi.org/doi:10.18129/B9.bioc.edgeR) package:

```
Rscript ./r-scripts/pairwise_comparisons.R -e expression_matrix.tsv -d project_design_file.tsv
```

This will create a directory, by default named `pairwise_files`, which contains pairwise comparisons for each treatment in your dataset. The **%%field-pairwiseName%%** field on the left configures how DrEdGE will find comparison files.  The characters \'%A\' and \'%B\' will be replaced by pairs of treatment identifiers. For example: If treatments T1 and T2 are compared in a table called `T1_vs_T2.tsv`, in the directory `pairwise_tests/`, the value in this field should be `pairwise_tests/%A_vs_%B.tsv`. If you used the defaults from the R script, you will not need to change this value.

Example: https://github.com/dredge-bio/example-dataset/blob/master/pairwise_files/AB_vs_P1.tsv

 If you want to use your own methods for generating statistics, generate pairwise pairwise comparisons for each treatment using the codename in your project design file. Each file must be tab-separated table with four columns in the following order: transcript codename, log₂ Fold Change, log₂ Reads per Million (or similarly normalized abundance values), and p-value. The first row will be discarded as a header. The transcript names must match those found in the transcript abundance matrix.

## MA Plot limits

The `pairwise_comparisons.R` script will also generate another file, `min_max.txt`, which contains information about the minimum and maximum values of log₂ Fold Change and log₂ Reads per Million across all of the generated pairwise comparisons. Enter these values into the **%%field-maPlot%%** field.

# Testing

At this point, you should test your configuration. Press the **Test** button above the form. If all goes well, you should be presented with a DrEdGE interface that allows you to browse your dataset. At this point, you have a fully functional DrEdGE interface. The rest of the guide provides instructions for adding more visual representations (e.g. a diagram representing the treatments in your dataset).


# Configuring visualizations

In your DrEdGE application, you can configure two different visualizations that provide a clickable heatmap of transcript abundance among treatments in your dataset. The first, and most simple, is a **grid** in which a matrix of squares represent treatments. The second is an **SVG diagram** in which different shapes represent treatments.

## Grid

To create a grid, create a table in Excel or a similar program, and fill in cells with treatment codenames in whatever manner you choose. Export this file to your DrEdGE directory as a CSV or TSV, and enter its filename in the **%%field-grid%%** field on the left.

Example: https://github.com/dredge-bio/example-dataset/blob/master/grid.csv

If you do not provide a grid, one will be automatically created for your dataset. In the default grid, treatments are simply laid out in a rectangular pattern.

## Diagram

You can create a custom diagram to illustrate the treatments in your dataset using a program that can export SVG, such as [Inkscape](https://inkscape.org/) or Adobe Illustrator. Creating SVGs is outside the scope of this guide, but the following will provide instructions for exporting SVG images that will work with DrEdGE.

Because of the layout of a DrEdGE application, your diagram will fit best if its size is roughly 6x1 (e.g. 720x120px). DrEdGE links objects in your SVG to treatments by looking at the `id` attribute of shapes (e.g. `rect`, `circle`, `polygon`). Shapes corresponding to treatment codenames will be filled with shades of the heatmap and become clickable to select treatments on the MA plot. However, note that in order for ID attributes to match treatment codenames, *your treatment codenames must only use the characters a-z, A-Z, 0-9, ., and -*.

Example: https://github.com/dredge-bio/example-dataset/blob/master/icons.svg?short_path=a9750c6

### Inkscape

Inkscape uses SVG as its native format. To declare that a shape corresponds to a treatment, right click on a shape, select "Object properties", and enter the treatment codename in the ID field. Save your SVG to the DrEdGE directory, and enter its filename into the **%%field-diagram%%** field on the left.

### Illustrator

Adobe Illustrator has many options for [exporting SVG images](https://css-tricks.com/illustrator-to-svg/). To make DrEdGE recognize which shapes correspond to which of your treatments, take the following steps. First, in the "Layers" panel, rename each shape corresponding to a treatment with that treatment's codename. (Note: You must give the treatment codename to the **shape**, like a rectangle or circle or path, **not** the layer itself). Next, go to **File > Export > Export as** in the Illustrator menu, and save your SVG to the DrEdGE directory. In the "SVG Options" menu that pops up, set the "Object IDs" option to "Layer names". This will assign `id` attributes to the shapes in your SVG fields based on the names you assigned to them in the layer panel. Enter the name of the SVG file you saved into the **%%field-diagram%%** field on the left.


## Configuring the heatmap

Both the grid and the diagram will appear as a heatmap visualization when browsing your DrEdGE application. Parts of the visualization corresponding to different treatments will be colored differently corresponding to the relative abundance of different transcripts. By default, the scale of the heatmap will vary across every transcript, ranging from 0 to the maximum abundance of a transcript across every treatment. However, that color scale may be deceiving for transcripts whose values are all effectively 0. The **%%field-heatmapMinimumMaximum%%** field on the left configures a minimum value that should be used as the maximum of the heatmap color scale. Set it to a value higher than 0 to remain above some noise threshold.


# Additional options

Several other options will adjust the way DrEdGE presents your project.

## Project documentation


<!--
The **gene expression matrix** should be a tab-separated table of normalized transcript abundance values, with each row representing a unique transcript, and each column representing a replicate. The header row should contain replicate ID that match those in the **project design file**. The first column should be a list of every transcript in the dataset. The top-leftmost cell of the table should be empty. This will look like:

```
      r1      r2      r3        r4
t1    32.2    24.3    6742.3    0.04
t2    43.1    44.1    5423.1    9.1
t3    19.1    100.2   661.9     5.4
t4    154.1   0.4     555.1     6.2
```

Where the abundance of t1 in r1 is 32.2, the abundance of t1 in r2 is 24.3, and so on.

Copy this file to the `%%PROJECT-DATA-DIR%%` directory, and record it in the **Gene Expression Matrix URL** field to the left. For this example, we will assume this file is called `%%PROJECT-DATA-DIR%%/expression_matrix.tsv`

## Generating DrEdGE data

Once these files are ready, you will be able to generate the files for **treatment information** and **pairwise comparisons** as well as the appropriate **MA Plot limits** for your project.

First, open a terminal and change directories to `%%PROJECT-DATA-DIR%%`. Then run the R script included in the zip file called `JSON_treatments.R`, using the command:

```
Rscript ../r-scripts/JSON_treatments.R -i experiment_design_file.tsv
```

By default, this will generate the file `%%PROJECT-DATA-DIR%%/treatments.json`, but you may change the location of the output file with the `-o` command line flag. Record the location of the output file in the field for **Treatment information URL**

Run the pairwise comparison generation script in much the same way, using the R script `pairwise_comparisons.R`:

```
Rscript ../r-scripts/pairwise_comparisons.R -e expression_matrix.tsv -d experiment_design_file.tsv
```

This will generate a directory full of pairwise comparisons between different treatments. By default, the folder is `pairwise_files`, but this can be adjusted with the `-o` flag. This value should be recorded in the **Pairwise comparison URL template** field. The script will also create a file showing the minimum and maximum average transcript abundance. By default, this will be called `min_max.txt` but can be adjusted with the `-m` flag. The values reported in this file can be used to complete the **MA plot limits** fields, with "logCPM" relevant to the x-axis, and "logFC" relevant to the x-axis. We recommend setting the y-axis minimum and maximum to numbers with the same absolute value, to keep logFC=0 centered.

Once you have filled out the configuration on the left, press the "Test" button to see if your configuration loads appropriately. If you are satisfied, press the "Save" button, which will download a configuration file. By default, it will be called `project.json`, but you may change the name if you wish. Save this configuration file to the `%%PROJECT-DATA-DIR%%` folder on your hard drive. 

Now edit the `index.html` file in the `%%PROJECT-DIR%%` folder, following the instructions to point your project to the appropriate location of the configuration file, which should be: `%%PROJECT-DATA-DIR%%/project.json`.

Restart DrEdGE by loading the local index page (i.e. <http://localhost:8000/> or <http://127.0.0.1:8000/>) to see your project. If you wish to host your project on the Web, you may now upload the entire DrEdGE folder to your server.
-->
