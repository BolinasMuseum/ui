var bm = {};
 
(function ($, fluid) {
    // BM Mimic the use of different templates for authority records
    fluid.defaults("bm.toggleVocabTemplateFields", {
        gradeNames: ["fluid.viewComponent"],
        selectors: {
            templatetrigger: ".vocab-template"
        }
    });
    bm.toggleVocabTemplateFields = function (container, options) {
        var that = fluid.initView("bm.toggleVocabTemplateFields", container, options);

        var re = /\?vocab=(.*)/;
        if (that.locate("templatetrigger")) {

            var vocab = that.container.context.location.search;
            //= ?vocab=person

            // get the name of the vocab
            if (vocab && vocab.length){
                var vocab_match = vocab.match(re);
                if (vocab_match && vocab_match.length > 1) {
                    // hide matching selectors
                    var vocabHideSelector = ".vocab-hide-" + vocab_match[1];
                    //$(vocabHideSelector).hide();

                    // show matching selectors
                    var vocabShowSelector = ".vocab-show-" + vocab_match[1];
                    //$(vocabShowSelector).show();

                    // TODO
                    // can't figure out how to get this function to get applied after ALL RecordEditor.js events have completed
                    // manually appling a style block will have to do...
                    $("head").append("<style>\n" + vocabHideSelector + " {display:none;}\n" + vocabShowSelector + " {display:block;}" + "\n</style>");
                }
            }
        }

        return that;
    };
})(jQuery, fluid);