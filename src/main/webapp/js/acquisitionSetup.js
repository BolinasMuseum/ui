/*
Copyright 2009-2010 University of Toronto
Copyright 2009 University of Cambridge

Licensed under the Educational Community License (ECL), Version 2.0. 
You may not use this file except in compliance with this License.

You may obtain a copy of the ECL 2.0 License at
https://source.collectionspace.org/collection-space/LICENSE.txt
*/

/*global jQuery, window, cspace*/

var demo = demo || {};

(function ($) {

    cspace.acquisitionSetup = function () {

        var setUpPage = function () {
            var deOpts = {
                dataContext: "{pageBuilder}.dataContext",
                applier: "{pageBuilder}.applier",
                uispec: "{pageBuilder}.uispec.dataEntry"
            };
            var sbOpts = {
                relations: "{pageBuilder}.model.relations",
                termsUsed: "{pageBuilder}.model.termsUsed",
                uispec: "{pageBuilder}.uispec.sidebar"
            }
    
            var dependencies = {
                dataEntry: {
                    funcName: "cspace.dataEntry",
                    args: [".csc-acquisition-template", deOpts]
                },
                sidebar: {
                    funcName: "cspace.sidebar",
                    args: [".csc-sidebar", sbOpts]
                }
            };
            var options = {
                dataContext: {
                    options: {
                        recordType: "acquisition"
                    }
                },
                pageSpec: {
                    dateEntry: {
                        href: "acquisitionTemplate.html",
                        templateSelector: ".csc-acquisition-template",
                        targetSelector: ".csc-acquisition-container"
                    },
                    sidebar: {
                        href: "right-sidebar.html",
                        templateSelector: ".csc-right-sidebar",
                        targetSelector: ".csc-sidebar-container"
                    }
                }
            };
            var csid = cspace.util.getUrlParameter("csid");
            if (csid) {
                options.csid = csid;
            }
            if (cspace.util.isLocal()) {
                options.dataContext.options.baseUrl = "data";
                options.dataContext.options.fileExtension = ".json";
            }
            cspace.pageBuilder(dependencies, options);
        };

        if (!cspace.pageBuilder || !cspace.pageBuilder.uispec) {
            jQuery.ajax({
                url: "./uispecs/acquisition/uispec-proto.json",
                type: "GET",
                dataType: "json",
                success: function (data, textStatus) {
                    cspace.pageBuilder.uispec = data;
                    setUpPage();
                },
                error: function (xhr, textStatus, errorThrown) {
                    console.log("Error fetching acquisition uispec");
                }
            });
        } else {
            setUpPage();
        }
    };
    
})(jQuery);

