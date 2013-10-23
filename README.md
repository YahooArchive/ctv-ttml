TTML Normalization
========

The purpose of this table is to take a TTML document and convert it to a well-defined JSON structure. The initial step is to remove all namespace references from the document. The next step is to flatten all of the paragraph tags to single line entries which can only contain the HTML break tag.
