#!/usr/bin/env Rscript

#~#~#~#~#
#
#	Script for creating differential expression pairwise comparison data tables from counts or RPKMs
#	Written by Sophia Tintori - sophia.tintori@gmail.com
#	Last updated May 14, 2019


# Install packages
if(!"optparse" %in% installed.packages()){
    install.packages("optparse", repos = "http://cran.us.r-project.org")
}
library("optparse")

# Define options and usage
option_list = list(
    make_option(c("-e", "--expression"), type="character", default=NULL,
                help="Path to transcript abundance table input. \n\t\tExample: ./expression_table.tsv", metavar="char"),
    make_option(c("-d", "--design"), type="character", default=NULL,
                help="Path to experimental design dataframe input. \n\t\tExample: ./design_table.tsv", metavar="char"),
    make_option(c("-o", "--outDirectory"), type="character", default="pairwise_files",
                help="Name of directory where pairwise comparison tables will be written. \n\t\tDefault: ./pairwise_files/", metavar="char"),
    make_option(c("-m", "--outMinMax"), type="character", default="min_max.txt",
                help="Output file specifying min and max values for MA plot axes. \n\t\tDefault: ./min_max.txt", metavar="char"),
    make_option(c("-r", "--repeatReplicates"), type="logical", default=FALSE,
                help="Set to TRUE if you want overlapping replicates to be included in both treatments. \n\t\tDefault: FALSE", metavar="log"),
    make_option(c("-t", "--noiseThreshold"), type="integer", default=10,
                help="Abundance threshold below which transcripts should not be considered for statistical analysis. \n\t\tDefault: 10", metavar="integer")
)
opt_parser = OptionParser(option_list=option_list, usage = "\n\tAccepts a gene expression matrix and a design file.\n\tReturns a directory of differential expression statistics for every possible pairwise comparison within the dataset.\n\n\tExample: Rscript pairwise_comparisons.R -e RPKMs_in.tsv -d design_in.tsv")
opt = parse_args(opt_parser)

# Define pairwise comparison generator function
pairwise_comparisons <- function(expression = opt$expression, design = opt$design,
                                 outDirectory = opt$outDirectory, outMinMax = opt$outMinMax,
                                 repeatReplicates = opt$repeatReplicates,
                                 lowerThreshold=opt$noiseThreshold){


    # Check data
    check.col.names <- read.table(expression, sep = "\n", stringsAsFactors = F, header = F)[1,]
    check.col.names <- strsplit(check.col.names, "\t")[[1]]
    for(i in check.col.names){
        if(substr(i,1,1)%in%c(0:9) || grepl("-", i)){
            return(paste("Error: Problem with replicate.id '", i, "'. Replicate.ids cannot start with a digit or contain the character '-'. Please edit your gene expression matrix and project design file accordingly.", sep = ""))
        }
    }

    # Install packages
    if (!requireNamespace("BiocManager"))
        install.packages("BiocManager")
    BiocManager::install("edgeR")
    library("edgeR")

    # Load data
    expRPKMs <- read.csv(expression, header = T, sep="\t", stringsAsFactors = F, row.names = 1)
    dir.create(outDirectory, showWarnings = F)
    # Make design list
    expList = list()
    if(substr(design, nchar(design)-4, nchar(design))%in%c(".json",".JSON")){
        if(!"rjson" %in% installed.packages()){
            install.packages("rjson", repos = "http://cran.us.r-project.org")
        }
        library("rjson")
        expList <- fromJSON(paste(readLines(design), collapse=""))
        if(length(expList)!=length(unique(names(expList)))){
            return("Error: Treatment IDs (first order object keys) must be unique.")
        }
    } else {
        expDesign <- read.csv(design, header = T, sep = "\t", stringsAsFactors = F)
        if(length(setdiff(c("treatment.id", "treatment.name", "replicate.id"), colnames(expDesign)))>0){
            return("Error: Design file must have the following columns: 'treatment.id', 'treatment.name', and 'replicate.id'.")
        }
        allTreatments <- unique(expDesign[,"treatment.id"])
        for(treatmentID in allTreatments){
            treatmentName <- unique(expDesign[which(expDesign$treatment.id==treatmentID),"treatment.name"])[1]
            treatmentReplicates <- expDesign[which(expDesign$treatment.id==treatmentID), "replicate.id"]
            expList[treatmentID] <- list(c(
                "label" = treatmentName,
                "replicates" = list(treatmentReplicates)
            ))
        }
    }
	print(expList)
	print(colnames(expRPKMs))
    minMax <- matrix(c(0,0,0,0), nrow = 2, dimnames = list(c("logCPM", "logFC"), c("min", "max")))

    allTreatments <- names(expList)
    for(treatment1 in allTreatments){
       for(tempReplicate in expList[[treatment1]]$replicates){
           if(!tempReplicate %in% colnames(expRPKMs)){
               return(paste("Error: replicate IDs in design file do not match column names of expression data file: ", tempReplicate, sep=""))
           }
       }
        replicates1 <- expList[[treatment1]]$replicates
        for(treatment2 in allTreatments){
            for(tempReplicate in expList[[treatment2]]$replicates){
                if(!tempReplicate %in% colnames(expRPKMs)){
                    return(paste("Error: replicate IDs in design file do not match column names of expression data file: ", tempReplicate, sep=""))
                }
            }
            replicates2 <- expList[[treatment2]]$replicates
            print(paste("Comparing ", treatment1, " to ", treatment2, sep = ""))
            tab = NULL
            # if there is overlap in replicates between the two treatments:
            if(length(intersect(replicates1, replicates2))>0){
                if(identical(sort(replicates1), sort(replicates2))){
                    # separate pipeline for comparing self to self
                    replicates <- unique(replicates1, replicates2)
                    subRPKMs <- expRPKMs[,c(replicates)]
                    if(length(replicates)>1){   # multiple replicates
                        subRPKMs <- subRPKMs[which(apply(subRPKMs,1,max)>lowerThreshold),]+1
                        tab <- matrix(1, nrow = nrow(subRPKMs), ncol = 3)
                        colnames(tab) <- c("logFC", "logCPM", "PValue")
                        row.names(tab) <- row.names(subRPKMs)
                        tab[,"logFC"] <- 0
                        tempMatrixSum <- sum(subRPKMs)
                        for(tempRow in 1:dim(subRPKMs)[1]){
                            tempGeneSum <- sum(subRPKMs[tempRow,])
                            tempCPM <- tempGeneSum*(1000000/tempMatrixSum)
                            tab[tempRow, "logCPM"] <- signif(log2(tempCPM), digits=3)
                        }
                    }
                    else {  # single replicate
                        names(subRPKMs) <- rownames(expRPKMs)
                        subRPKMs <- subRPKMs[which(subRPKMs>lowerThreshold)]+1
                        tab <- matrix(1, nrow = length(subRPKMs), ncol = 3)
                        colnames(tab) <- c("logFC", "logCPM", "PValue")
                        tab[,"logFC"] <- 0
                        tempMatrixSum <- sum(subRPKMs)
                        for(tempRow in 1:length(subRPKMs)){
                            tempCPM <- subRPKMs[tempRow]*(1000000/tempMatrixSum)
                            tab[tempRow, "logCPM"] <- signif(log2(tempCPM), digits=3)
                        }
                    }
                    outputName = paste(treatment1, "_vs_", treatment2, ".tsv", sep="")
                    write.table(tab, paste(outDirectory, "/", outputName, sep = ""), quote = F, col.names = NA, row.names = T, sep = "\t")
                    minMax["logCPM", "min"] <- min(minMax["logCPM", "min"], min(tab[,"logCPM"]))
                    minMax["logCPM", "max"] <- max(minMax["logCPM", "max"], max(tab[,"logCPM"]))
                    minMax["logFC", "min"] <- min(minMax["logFC", "min"], min(tab[,"logFC"]))
                    minMax["logFC" ,"max"] <- max(minMax["logFC", "max"], max(tab[,"logFC"]))
                    next
                }
                else {
                    repeatedReps <- intersect(replicates1, replicates2)
                    print("WARNING: The following replicates are in both treatments:")
                    print(repeatedReps)
                    if(repeatReplicates){
                        print("They are being included on both sides of the comparison because the -r flag is set to TRUE")
                    } else {
                        treatmentLengths <- c(length(setdiff(replicates1, repeatedReps)), length(setdiff(replicates2, repeatedReps)))
                        thinnedTreatment <- which(treatmentLengths==max(treatmentLengths))
                        if(thinnedTreatment==1){
                            replicates1 <- setdiff(replicates1, repeatedReps)
                        } else if (thinnedTreatment==2){
                            replicates2 <- setdiff(replicates2, repeatedReps)
                        }
                        print(paste("They are being removed (from the ", c(treatment1, treatment2)[thinnedTreatment], " treatment) because the -r flag is set to FALSE", sep=""))
                    }
                }
            }
            subRPKMs <- expRPKMs[,c(replicates1, replicates2)]
            subRPKMs <- subRPKMs[which(apply(subRPKMs,1,max)>lowerThreshold),]
            subRPKMs <- subRPKMs + 1
            group <- factor(c(rep(treatment1, length(replicates1)),
                              rep(treatment2, length(replicates2))), levels = c(treatment1, treatment2))
            if(dim(subRPKMs)[2]>2){
                # push through edgeR
                y <- DGEList(counts=subRPKMs, group=group)
                y <- calcNormFactors(y)
                y <- estimateCommonDisp(y)
                y <- estimateTagwiseDisp(y)
                et <- exactTest(y)
                tab <- signif(et$table, digits=3)
                tab[,c("logFC", "logCPM")] <- signif(tab[,c("logFC", "logCPM")], digits=3)
            } else {
                tab <- matrix(0, nrow = nrow(subRPKMs), ncol = 3)
                colnames(tab) <- c("logFC", "logCPM", "PValue")
                tempMatrixSum <- sum(subRPKMs)
                for(tempRow in 1:dim(subRPKMs)[1]){
                    #logCPM
                    tempGeneSum <- sum(subRPKMs[tempRow,])
                    tempCPM <- tempGeneSum*(1000000/tempMatrixSum)
                    tab[tempRow, "logCPM"] <- signif(log2(tempCPM), digits=3)
                    #logFC
                    tempTr1Avg <- mean(subRPKMs[tempRow, which(group==treatment1)])
                    tempTr2Avg <- mean(subRPKMs[tempRow, which(group==treatment2)])
                    tempFC <- (tempTr2Avg/tempTr1Avg)
                    tab[tempRow, "logFC"] <- signif(log2(tempFC), digits=3)
                    #PValue
                    tab[tempRow, "PValue"] = 1
                }
            }
            row.names(tab) <- row.names(subRPKMs)
            minMax["logCPM", "min"] <- min(minMax["logCPM", "min"], min(tab[,"logCPM"]))
            minMax["logCPM", "max"] <- max(minMax["logCPM", "max"], max(tab[,"logCPM"]))
            minMax["logFC", "min"] <- min(minMax["logFC", "min"], min(tab[,"logFC"]))
            minMax["logFC" ,"max"] <- max(minMax["logFC", "max"], max(tab[,"logFC"]))
            outputName = paste(treatment1, "_vs_", treatment2, ".tsv", sep="")
            write.table(tab, paste(outDirectory, "/", outputName, sep = ""), quote = F, col.names = NA, row.names = T, sep = "\t")
        }
        allTreatments <- allTreatments[allTreatments!=treatment1]
   }
#   Export min_max table
    write.table(x = minMax, file = outMinMax, col.names = NA, quote = F, sep = "\t")
}

# Run analysis
pairwise_comparisons()
if(length(warnings())>0){
    print(warnings())
}
