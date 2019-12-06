# DrEdGE (Differential Expression Gene Explorer)

DrEdGE is a browser-based application for visualizing quantitative gene expression data. For more information, and for instructions on setting up your own DrEdGE project, see the [project homepage](http://dredge.bio.unc.edu/)

# Building

DrEdGE is built using npm and its build system is automated with `make`. To change the code, make sure you have [`npm`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed and run the commands `make watch` and `make serve`. This will automatically rebuild the application and serve it at <http://localhost:9999>.

To create a zipfile of the current tagged version of DrEdGE, run `make zip`.
