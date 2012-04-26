/*
Copyright 2011 Museum of Moving Image

Licensed under the Educational Community License (ECL), Version 2.0. 
You may not use this file except in compliance with this License.

You may obtain a copy of the ECL 2.0 License at
https://source.collectionspace.org/collection-space/LICENSE.txt
 */

/*global jQuery, fluid, cspace:true*/
"use strict";

cspace = cspace || {};

(function ($, fluid) {
    fluid.log("ComputedField.js loaded");
    
    fluid.defaults("cspace.computedField", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        preInitFunction: "cspace.computedField.preInit",
        postInitFunction: "cspace.computedField.postInit",
        finalInitFunction: "cspace.computedField.finalInit",
        invokers: {
            lookupMessage: "cspace.util.lookupMessage",
            validate: {
                funcName: "cspace.computedField.validate",
                args: ["{computedField}", "{arguments}.0", "{messageBar}", "{arguments}.1"]
            },
            showMessage: {
                funcName: "cspace.computedField.showMessage",
                args: ["{messageBar}", "{arguments}.0"]
            },
            clear: {
                funcName: "cspace.computedField.clear",
                args: "{messageBar}"
            },
            bindModelEvents: {
                funcName: "cspace.computedField.bindModelEvents",
                args: "{computedField}"
            },
            resolveElPath: {
                funcName: "cspace.computedField.resolveElPath",
                args: ["{computedField}", "{arguments}.0"]
            },
            refresh: {
                funcName: "cspace.computedField.refresh",
                args: "{computedField}"
            },
            calculateFieldValue: {
                funcName: "cspace.computedField.calculateFieldValue",
                args: "{computedField}"
            },
            getArgListenerNamespace: {
                funcName: "cspace.computedField.getArgListenerNamespace",
                args: ["{computedField}", "{arguments}.0"]
            },
            getFieldListenerNamespace: {
                funcName: "cspace.computedField.getFieldListenerNamespace",
                args: "{computedField}"
            }
        },
        events: {
            removeListeners: null
        },
        listeners: {
            removeListeners: {
                listener: "{computedField}.removeApplierListeners"
            }
        },

        // The root EL path of this field in the model. This will be non-empty if this is a repeating field.
        root: "",

        // The EL path of this field, relative to the root.
        elPath: "",

        // The name of the calculation function used to compute the field value.
        func: "cspace.computedField.joinArgs",

        // Arguments to the calculation function. These are specified as EL paths.
        // See cspace.computedField.resolveElPath for details on how these paths are resolved in the model.
        args: [],

        // The datatype used for validation.
        type: "string",

        // The delay in ms to wait after a key is pressed before validating the field entry.
        delay: 500
    });
       
    cspace.computedField.preInit = function (that) {
        that.applierListenerNamespaces = [];
        
        that.removeApplierListeners = function () {
            fluid.each(that.applierListenerNamespaces, function(namespace) {            
                that.applier.modelChanged.removeListener(namespace);
            });
        };
    };

    cspace.computedField.postInit = function (that) {
        that.container.keyup(function () {
            clearTimeout(that.outFirer);
            that.outFirer = setTimeout(function () {
                that.clear();
                var value = that.container.val();
                that.validate(value, that.invalidNumberMessage);
            }, that.options.delay);
        });
    };

    cspace.computedField.finalInit = function (that) {
        that.labelText = "";

        if (that.options.label) {
            that.labelText = that.lookupMessage(that.options.label) + ": ";
        }

        that.invalidNumberMessage = fluid.stringTemplate(that.lookupMessage("invalidNumber"), {
            label: that.labelText
        });

        that.invalidCalculationMessage = fluid.stringTemplate(that.lookupMessage("errorCalculating"), {
            label: that.labelText,
            status: that.lookupMessage("invalidCalculatedNumber")
        });

        if (that.options.readOnly) {
            that.container.attr("disabled", true);
        }
        
        that.fullElPath = cspace.util.composeSegments(that.options.root, that.options.elPath);
        that.bindModelEvents();
    };

    /*
     * Registers listeners for changes in the model.
     * When the value at an EL path specified as an argument to the calculation function is changed, recompute the field value, and update the model.
     * When the value of the field is updated in the model, update it in the view.
     */
    cspace.computedField.bindModelEvents = function (that) {
        fluid.each(that.options.args, function(argElPath) {
            var fullArgElPath = that.resolveElPath(argElPath);
            var namespace = that.getArgListenerNamespace(argElPath);
            
            that.applier.modelChanged.addListener(fullArgElPath, function(model) {
                that.refresh();
            }, namespace);

            that.applierListenerNamespaces.push(namespace);
        });

        var namespace = that.getFieldListenerNamespace();

        that.applier.modelChanged.addListener(that.fullElPath, function(model) {
            that.container.val(fluid.get(model, that.fullElPath));
        }, namespace);

        that.applierListenerNamespaces.push(namespace);      
    };

    /*
     * Updates the field value in the model, showing an error message if necessary.
     */
    cspace.computedField.refresh = function (that) {
        that.clear();

        var newValue;

        try {
            newValue = that.calculateFieldValue();
        }
        catch (error) {
            var message = fluid.stringTemplate(that.lookupMessage("errorCalculating"), {
                label: that.labelText,
                status: error.message
            });
            
            that.showMessage(message);
            return;
        }
        
        if (!that.validate(newValue, that.invalidCalculationMessage)) {
            return;
        }
        
        that.applier.requestChange(that.fullElPath, newValue);      
    }

    /*
     * Calculates the field value, applying the configured calculation function to the values
     * of the argument EL paths in the model.
     */
    cspace.computedField.calculateFieldValue = function (that) {
        var args = [];

        fluid.each(that.options.args, function(argElPath) {
            var fullElPath = that.resolveElPath(argElPath);
            args.push(fluid.get(that.model, fullElPath));
        });

        return fluid.invoke(that.options.func, args);
    };

    /*
     * Resolve the given EL path.
     * The argument elPath is simply appended to the root, so argument fields must be under the same root as this field.
     * TODO: Make this function smarter about finding argument elPaths that are outside of this field's root.
     * Returns the full EL path.
     */
    cspace.computedField.resolveElPath = function (that, elPath) {
        return cspace.util.composeSegments(that.options.root, elPath);
    };
    
    /*
     * Returns the passed arguments as a comma separated string. This is useful as a default calculation function.
     */
    cspace.computedField.joinArgs = function () {
        var args = Array.prototype.slice.call(arguments);
        return args.join(", ");
    };

    /*
     * Returns a unique namespace name for a given argument EL path.
     */
    cspace.computedField.getArgListenerNamespace = function (that, elPath) {
        return  ("argElPath-" + elPath + "-" + that.id);
    };

    /*
     * Returns a unique namespace name for this component's field.
     */
    cspace.computedField.getFieldListenerNamespace = function (that) {
        return  ("elPath-" + that.id);
    };

    cspace.computedField.validate = function (that, value, messageBar, message) {
        var valid = true;
        
        if (that.options.type && that.options.type != "string") {
            valid = cspace.util.validate(value, that.options.type, messageBar, message);            
        }
        
        return valid;
    }

    cspace.computedField.showMessage = function (messageBar, message) {
        messageBar.show(message, null, true);
    }

    cspace.computedField.clear = function (messageBar) {
        messageBar.hide();
    };
})(jQuery, fluid);