#!/usr/bin/env Rscript

# Install packages
if(!"optparse" %in% installed.packages()){
    install.packages("optparse", repos = "http://cran.us.r-project.org")
}
library("optparse")

# Define options and usage
option_list = list(
    make_option(c("-e", "--expression"), type="character", default=NULL,
                help="path to gene expression matrix input", metavar="character"),
    make_option(c("-d", "--design"), type="character", default=NULL,
                help="path to experimental design data frame input", metavar="character"),
    make_option(c("-o", "--outDirectory"), type="character", default="pairwise_files",
                help="output directory name", metavar="character"),
    make_option(c("-m", "--outMinMax"), type="character", default="min_max.txt",
                help="output file specifying min and max values for MA plot axes", metavar="character")
)
opt_parser = OptionParser(option_list=option_list, usage = "\n\tAccepts a gene expression matrix and a design file.\n\tReturns a directory of differential expression statistics for every possible pairwise comparison within the dataset.\n\n\tExample: Rscript pairwise_comparisons.R -e RPKMs_in.txt -d design_in.txt -o pairwise_files_out/ -m minMax_out.txt")
opt = parse_args(opt_parser)

# Define pairwise comparison generator function
pairwise_comparisons <- function(expression = opt$expression, design = opt$design,
                                 outDirectory = opt$outDirectory, outMinMax = opt$outMinMax){

    # Install packages
    if(!"edgeR" %in% installed.packages()){
        source("https://www.bioconductor.org/biocLite.R")
        biocLite('edgeR', ask = FALSE)
    }
    library("edgeR")
    expRPKMs <- read.csv(expression, header = T, sep="\t", stringsAsFactors = F, row.names = 1)
    lowerThreshold = 10
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
    minMax <- matrix(c(0,0,0,0), nrow = 2, dimnames = list(c("logCPM", "logFC"), c("min", "max")))

    allTreatments <- names(expList)
    for(treatment1 in allTreatments){
       for(tempReplicate in expList[[treatment1]]$replicates){
           if(!tempReplicate %in% colnames(expRPKMs)){
               return(paste("Error: replicate IDs in design file do not match column names of expression data file: ", tempReplicate, sep=""))
           }
       }
        replicates1 <- expList[[treatment1]]$replicates
        for(treatment2 in allTreatments[allTreatments!=treatment1]){
            for(tempReplicate in expList[[treatment2]]$replicates){
                if(!tempReplicate %in% colnames(expRPKMs)){
                    return(paste("Error: replicate IDs in design file do not match column names of expression data file: ", tempReplicate, sep=""))
                }
            }
            replicates2 <- expList[[treatment2]]$replicates
            print(paste("Comparing ", treatment1, " to ", treatment2, sep = ""))
            subRPKMs <- expRPKMs[,c(replicates1, replicates2)]
            subRPKMs <- subRPKMs[which(apply(subRPKMs,1,max)>lowerThreshold),]
            subRPKMs <- subRPKMs + 1
            group <- factor(c(rep(treatment1, length(replicates1)),
                              rep(treatment2, length(replicates2))), levels = c(treatment1, treatment2))
            tab <- NULL
            if(dim(subRPKMs)[2]>2){
                # push through edgeR
                y <- DGEList(counts=subRPKMs, group=group)
                y <- calcNormFactors(y)
                y <- estimateCommonDisp(y)
                y <- estimateTagwiseDisp(y)
                et <- exactTest(y)
                tab <- round(et$table, digits=10)
                tab[,c("logFC", "logCPM")] <- round([,c("logFC", "logCPM")], digits=1)
            } else {
                tab <- matrix(0, nrow = nrow(subRPKMs), ncol = 3)
                colnames(tab) <- c("logFC", "logCPM", "PValue")
                tempMatrixSum <- sum(subRPKMs)
                for(tempRow in 1:dim(subRPKMs)[1]){
                    #logCPM
                    tempGeneSum <- sum(subRPKMs[tempRow,])
                    tempCPM <- tempGeneSum*(1000000/tempMatrixSum)
                    tab[tempRow, "logCPM"] <- round(log2(tempCPM), digits=1)
                    #logFC
                    tempTr1Avg <- mean(subRPKMs[tempRow, which(group==treatment1)])
                    tempTr2Avg <- mean(subRPKMs[tempRow, which(group==treatment2)])
                    tempFC <- (tempTr2Avg/tempTr1Avg)
                    tab[tempRow, "logFC"] <- round(log2(tempFC), digits=1)
                    #PValue
                    tab[tempRow, "PValue"] = 1
                }
            }
            row.names(tab) <- row.names(subRPKMs)

            minMax["logCPM", "min"] <- min(minMax["logCPM", "min"], min(tab[,"logCPM"]))
            minMax["logCPM", "max"] <- max(minMax["logCPM", "max"], max(tab[,"logCPM"]))
            minMax["logFC", "min"] <- min(minMax["logFC", "min"], min(tab[,"logFC"]))
            minMax["logFC" ,"max"] <- max(minMax["logFC", "max"], max(tab[,"logFC"]))
            outputName = paste(treatment1, "_vs_", treatment2, ".txt", sep="")
            write.table(tab, paste(outDirectory, "/", outputName, sep = ""), quote = F, col.names = NA, row.names = T, sep = "\t")
        }
        allTreatments <- allTreatments[allTreatments!=treatment1]
   }

    # Add self_self comparisons
    allTreatments <- names(expList)
    for(treatment in allTreatments){
        tab = NULL
        replicates <- expList[[treatment]]$replicates
        print(paste("Comparing ", treatment, " to ", treatment, sep = ""))
        subRPKMs <- expRPKMs[,c(replicates)]
        if(length(replicates)>1){
            subRPKMs <- subRPKMs[which(apply(subRPKMs,1,max)>lowerThreshold),]+1
            tab <- matrix(1, nrow = nrow(subRPKMs), ncol = 3)
            colnames(tab) <- c("logFC", "logCPM", "PValue")
            row.names(tab) <- row.names(subRPKMs)
            tab[,"logFC"] <- 0
            tempMatrixSum <- sum(subRPKMs)
            for(tempRow in 1:dim(subRPKMs)[1]){
                tempGeneSum <- sum(subRPKMs[tempRow,])
                tempCPM <- tempGeneSum*(1000000/tempMatrixSum)
                tab[tempRow, "logCPM"] <- round(log2(tempCPM), digits=1)
            }
        } else {
            names(subRPKMs) <- rownames(expRPKMs)
            subRPKMs <- subRPKMs[which(subRPKMs>lowerThreshold)]+1
            tab <- matrix(1, nrow = length(subRPKMs), ncol = 3)
            colnames(tab) <- c("logFC", "logCPM", "PValue")
            tab[,"logFC"] <- 0
            tempMatrixSum <- sum(subRPKMs)
            for(tempRow in 1:length(subRPKMs)){
                tempCPM <- subRPKMs[tempRow]*(1000000/tempMatrixSum)
                tab[tempRow, "logCPM"] <- round(log2(tempCPM), digits=1)
            }
        }
        minMax["logCPM", "min"] <- min(minMax["logCPM", "min"], min(tab[,"logCPM"]))
        minMax["logCPM", "max"] <- max(minMax["logCPM", "max"], max(tab[,"logCPM"]))
        minMax["logFC", "min"] <- min(minMax["logFC", "min"], min(tab[,"logFC"]))
        minMax["logFC" ,"max"] <- max(minMax["logFC", "max"], max(tab[,"logFC"]))
        outputName = paste(treatment, "_vs_", treatment, ".txt", sep="")
        write.table(tab, paste(outDirectory, "/", outputName, sep = ""), quote = F, col.names = NA, row.names = T, sep = "\t")
    }
#   Export min_max table
    write.table(x = minMax, file = outMinMax, col.names = NA, quote = F, sep = "\t")
}

# Run analysis
pairwise_comparisons()
if(length(warnings())>0){
    print(warnings())
}
