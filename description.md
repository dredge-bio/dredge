# Outline for gene expression data viz project

2015.08.13

## Main feature
The main feature of the visualization is the dot plot. This plot allows the user to compare gene expression of every gene in one cell to gene expression in another cell. Each dot represents a single gene, and the dots are plotted by their average expression level (x axis), and how much they are enriched in one cell or the other, or their fold change (y axis).

## Tooltips with extra information
When any dot is hovered over, a box will pop up with the gene name, and a static cartoon summarizing that gene's expression over time. It would be very cool if the gene name could be clicked on to send the user that gene's page in wormbase. 

## Change dotplot by selecting other cells of interest
There will be a diagram on the top and bottom of the plot, showing all the cells available for comparison. When the user clicks on a cell in the top, the plot will be re-drawn so that this cell is now one of the two being compared. Same for the diagrams on the bottom.

## Exporting gene lists
When a dot (gene) is clicked on, a little circle will appear around the gene, and the gene's name will be added to a list on the right. This list can be copied and pasted out of the browser. Conversely, the user can paste a number of genes into the list, and all of those genes will get circled on the dot plot.

## Alternative gene names
One of the challenges of allowing the user to type in gene names, is that there are many naming schemes for worm genes, meaning there are many names for a single gene. If the user types in a name that is different than the ones I like to use, the name will get switched.

## Highlighting significantly different genes
The user can move a slider to designate what P-value they would like to highlight. If they set the slider to .1, any genes with a P-value under .1 will turn red. It would also be cool if there was a button to export a list of everything highlighted in red (all 'significant' genes). It would be doubly cool if they could export only the significant genes on one side of the plot or the other (i.e., only genes that are significantly enriched in one cell, or in the other).
