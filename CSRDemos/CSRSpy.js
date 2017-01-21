/*
 *  @copyright 2016-2017 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function () {
    // this array is the only thing that needs to be modified to override more or different fields
    var fields = [
        "SalesRegion",
        "FullName",
        "Address",
        "WebPage"
    ];

    var spy = function (ctx) {
        // get the list schema for all fields
        var schema = window[ctx.FormUniqueId + "FormCtx"].ListSchema;
        // get the default templates for each field type
        var templatesByType = SPClientTemplates._defaultTemplates.Fields.default.all.all;
        // get the default templates for the current field type
        var currentTemplate = templatesByType[ctx.CurrentFieldSchema.Type];
        // get the render function by view id (i.e. NewForm, EditForm, or DisplayForm)
        var currentRenderFunc = currentTemplate[ctx.BaseViewID];
        // call the render function
        var result = currentRenderFunc(ctx);
        // do your own work here
        return result;
    }

    /*
     * Create an empty overrides object.
     */
    var overrides = {
        Templates: {
            'Fields': {}
        }
    };

    /*
     * Add an overrides object for each field we want to customize.
     */
    for(var i=0; i<fields.length; i++) {
        var current = fields[i];
        overrides.Templates.Fields[current] = {
            'NewForm': spy,
            'EditForm': spy,
            'DisplayForm': spy
        };
    }

    // register the template overrides
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
})();
