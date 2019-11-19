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

DrEdGE is an application for visualizing quantitative gene expression data in a Web browser. It runs exclusively using static files stored on a file system, with no requirement of a database or server to run and store statistical analyses. This means that DrEdGE is easy to run and deploy, but it also means that you must create all the files needed for your project ahead of time. This guide will take you through the steps to create those files and configure DrEdGE to work with your own dataset.

We will follow along with a fully configured example located at <https://github.com/dredge-bio/example-dataset>. You can see how the example application looks at <https://dredge-bio.github.io/example-dataset/>. The example is a subset of <i>C. elegans</i> embryonic transcriptomes from [Tintori <i>et al.</i>, 2016](https://www.ncbi.nlm.nih.gov/pubmed/27554860).

A video tutorial of the configuration process described below is available at https://vimeo.com/336692169.

## Overview

The form on the left will generate a configuration file, named `project.json`, that will tell DrEdGE where to find your project's files, and how to configure the DrEdGE interface. As you fill out the form, you can press the **Test** button to check if the configuration is working properly. Once you are happy with your configuration, press the **Save** button, and save the `project.json` file inside the extracted DrEdGE directory. (You can also load an existing `project.json` file into the form by using the **Load** button). Once you have saved the `project.json` file, you can access your DrEdGE application at %%THIS-URL%%.


# Basic configuration

You will need two files to start: a project design file that describes the treatments used in your dataset, and a gene expression table that has RNA-seq measurements, or similar quantitative data, for each treatment replicate.

## Project name { data-field=label }

Enter the name of your project in the **%%field-label%%** field. This will appear in the top bar of your configured application.

## Project design file { data-field=treatments }

The project design file is a JSON file that tells DrEdGE the names of all the treatments and replicates in your project. 

Example: https://github.com/dredge-bio/example-dataset/blob/master/treatments.json

It can be generated de novo to match the format of the example file above, or it can be generated from a table using an R script provided in the DrEdGE package. 

If using this R script, the input table must tab-separated and include the following three columns:

  1. **replicate.id**: A unique codename given for the replicate

  2. **treatment.id**: A unique codename given to the treatment corresponding to the replicate

  3. **treatment.name**: A human-readable label given to the treatment defined with **treatment.id**. This is the text that will be shown around the DrEdGE interface to refer to treatments.

Example: https://github.com/dredge-bio/example-dataset/blob/master/project_design_file.tsv

Save this file to the DrEdGE directory (for example, `%%PROJECT-DIR%%/project_design_file.tsv`), and then run the following R command in that folder:

```
Rscript ./r-scripts/JSON_treatments.R -i project_design_file.tsv
```

This will generate the file `treatments.json`, which the **%%field-treatments%%** field on the left should point to. 

## Gene expression matrix { data-field="expressionMatrix" }

Next, we will configure the transcript abundance matrix and pairwise comparison tables. You must provide a **transcript abundance matrix** file, a tab-separated table of transcript abundance values (counts or normalized reads). Each row in the table represents a unique transcript, and each column represents a replicate. The header row should contain replicate IDs that match those in the **project design file**. The first column should be a list of every transcript in the dataset. The top-leftmost cell of the table should be empty.

Example: https://github.com/dredge-bio/example-dataset/blob/master/expression_matrix.tsv

Save this file to the DrEdGE directory and enter the filename into the **%%field-expressionMatrix%%** field on the left. 

## Differential expression data { data-field="pairwiseName" }

DrEdGE required pre-calculated differential expression tables for every possible pairwise set of treatments. You can generate these tables using any method you prefer, or you can run the R script provided in the DrEdGE package, which uses the [edgeR](https://doi.org/doi:10.18129/B9.bioc.edgeR) statistical package:
i
```
Rscript ./r-scripts/pairwise_comparisons.R -e expression_matrix.tsv -d treatments.JSON
```

This will create a directory, by default named `pairwise_files`, which contains pairwise comparisons for each treatment in your dataset. The **%%field-pairwiseName%%** field on the left configures how DrEdGE will find comparison files.  The characters \'%A\' and \'%B\' will be replaced by pairs of treatment identifiers. For example: If treatments T1 and T2 are compared in a table called `T1_vs_T2.tsv`, in the directory `pairwise_tests/`, the value in this field should be `pairwise_tests/%A_vs_%B.tsv`.

Example: https://github.com/dredge-bio/example-dataset/blob/master/pairwise_files/AB_vs_P1.tsv

If you want to use your own methods for generating statistics, generate pairwise pairwise comparisons for each treatment using the treatment IDs in your project design file. Each file must be tab-separated table with four columns in the following order: transcript ID, log₂ Fold Change, log₂ Reads per Million (or similarly normalized abundance values), and p-value. The first row will be discarded as a header. The transcript IDs must match those found in the transcript abundance matrix.

## MA Plot limits { data-field="maPlot" }

The `pairwise_comparisons.R` script will also generate a file, `min_max.txt`, containing information about the minimum and maximum values of log₂ Fold Change and log₂ Reads per Million across all of the generated pairwise comparisons. Enter these values into the **%%field-maPlot%%** field to set the default axis limits for your MA plot.

# Testing

At this point, you can test your configuration. Press the **Test** button above the form. If all goes well, you should be presented with a DrEdGE interface that allows you to browse your dataset. At this point, you have a fully functional DrEdGE interface. The rest of the guide provides instructions for additional features (e.g. graphical representations of the treatments in your dataset, and hyperlinks to external databases).

# Configuring visualizations

In your DrEdGE application, you can configure two different visualizations that provide a clickable heatmap of transcript abundance among treatments in your dataset. The first, and most simple, is a **grid** in which a matrix of squares represent treatments. The second is an **SVG diagram** in which custom icons represent treatments.

## Grid { data-field="grid" }

To create a grid, create a table in Excel or a similar program, and fill in cells with treatment IDs in whatever arrangement you prefer. Export this file to your DrEdGE directory as a CSV or TSV, and enter its filename in the **%%field-grid%%** field on the left.

Example: https://github.com/dredge-bio/example-dataset/blob/master/grid.csv

If you do not provide a grid, one will be automatically created for your dataset. In the default grid, treatments are simply laid out in a rectangular pattern.

## Diagram { data-field="diagram" }

You can create a custom diagram to illustrate the treatments in your dataset using a program that can exports SVG, such as [Inkscape](https://inkscape.org/) or Adobe Illustrator. Creating SVGs is outside the scope of this guide, but the following will provide instructions for exporting SVG images that will work with DrEdGE.

Because of the layout of a DrEdGE application, your diagram will fit best if its size is roughly 6x1 (e.g. 720x120px). DrEdGE links objects in your SVG to treatments by looking at the `id` attribute of shapes (e.g. `rect`, `circle`, `polygon`, `path`). Shapes corresponding to treatment IDs will be filled with shades of the heatmap and become clickable to select treatments on the MA plot. However, note that in order for ID attributes to match treatment codenames, *your treatment IDs must only use the characters a-z, A-Z, 0-9, ., and -*.

Example: https://github.com/dredge-bio/example-dataset/blob/master/icons.svg?short_path=a9750c6

### Inkscape

Inkscape uses SVG as its native format. To declare that a shape corresponds to a treatment, right click on a shape, select "Object properties", and enter the treatment codename in the ID field. Save your SVG to the DrEdGE directory, and enter its filename into the **%%field-diagram%%** field on the left.

### Illustrator

Adobe Illustrator has many options for [exporting SVG images](https://css-tricks.com/illustrator-to-svg/). To make DrEdGE recognize which shapes correspond to which of your treatments, take the following steps. First, in the "Layers" panel, rename each shape corresponding to a treatment with that treatment's codename. (Note: You must give the treatment codename to the **shape**, like a rectangle or circle or path, **not** the layer itself). Next, go to **File > Export > Export as** in the Illustrator menu, and save your SVG to the DrEdGE directory. In the "SVG Options" menu that pops up, set the "Object IDs" option to "Layer names". This will assign `id` attributes to the shapes in your SVG fields based on the names you assigned to them in the layer panel. Enter the name of the SVG file you saved into the **%%field-diagram%%** field on the left.


## Configuring the heatmap { data-field=heatmapMinimumMaximum }

Both the grid and the diagram will appear as a heatmap visualization when browsing your DrEdGE application. Icons corresponding to different treatments will be colored based on the relative abundance of different transcripts. By default, the scale of the heatmap will vary across every transcript, ranging from 0 to the maximum abundance of a transcript across every treatment. However, that color scale may be deceiving for transcripts whose values are all effectively 0. The **%%field-heatmapMinimumMaximum%%** field on the left configures the minimum range that can be represented by the heat map color scale. Set the second value to higher than 0 to force low abundance values to be colored at the lower end of the color scale.


# Additional options

Several other options will adjust the way DrEdGE presents your project.

## Alternate transcript names { data-field=transcriptAliases }

Each transcript can be referred to by many identifiers, any of which a user might use to search your DrEdGE page. To tell DrEdGE the different names for each transcript in your project, create a TSV or CSV file with one row for each transcript. Each row must start with a transcript ID used in **%%field-expressionMatrix%%**, followed by alternate names or codes for that transcript. Enter the name of this file in the **%%field-transcriptAliases%%** field.

Example: https://github.com/dredge-bio/example-dataset/blob/master/transcript_aliases.tsv


## Project documentation { data-field=readme }

You can provide documentation about your project using the [Markdown](https://commonmark.org/help/) file format. Enter the name of the file you create in the **%%field-readme%%** field.

Example: https://github.com/dredge-bio/example-dataset/blob/master/about.md

## Transcript hyperlink { data-field=transcriptHyperlink }

Transcripts can be linked to an external knowledge base using the **%%field-transcriptHyperlink%%** field.  The **Label** should be the name of the database, and the **URL** should be the template to generate a hyperlink based on a transcript ID. The string `%name` in the URL will be replaced with the name of a given transcript. For example, given a URL template with the value `http://example.com/biobase/gene/search/%name` and a transcript with the name `act-1`, the URL to get more information about the transcript would be `http://example.com/biobase/gene/search/act-1`.


# Deploying DrEdGE on the Web

Once you have configured your DrEdGE application to your liking, **Save** your configuration and place the `project.json` file inside the DrEdGE directory. To serve DrEdGE on the Web, upload this directory to a Web server that supports serving static files. Since there is no database to manage and no dynamic content to generate, you are finished! Your DrEdGE application will be available without any further maintenance for as long as you keep the files online.
