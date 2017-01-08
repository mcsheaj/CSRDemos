/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 *
 *  Inproved Autocomplete with configuable lookup list and field.
 */
(function ($) {
    // this structure is the only thing that needs to be modified to override more or different fields
    var fields = {
        "Company": {
            "list": "Companies",
            "field": "Title"
        },
        "JobTitle": {
            "list": "JobTitles",
            "field": "Title"
        }
    };
    var keys = Object.keys(fields);

    var autoCompletePostRender = function (ctx) {
        if ($.inArray(ctx.ListSchema.Field[0].Name, keys) > -1) {
            var $input = $("[id^='" + ctx.ListSchema.Field[0].Name + "_" + ctx.ListSchema.Field[0].Id + "']");
            var config = fields[ctx.ListSchema.Field[0].Name];
            $().SPServices({
                operation: "GetListItems",
                async: true,
                listName: config.list,
                CAMLViewFields: "<ViewFields><FieldRef Name='" + config.field + "' /></ViewFields>",
                CAMLQuery: "<Query><OrderBy><FieldRef Name='" + config.field + "' Ascending='True' /></OrderBy></Query>",
                completefunc: function (xData) {
                    var autocompleteData = [];
                    $(xData.responseXML).SPFilterNode("z:row").each(function () {
                        autocompleteData.push($(this).attr("ows_" + config.field));
                    });

                    if (autocompleteData.length > 0) {
                        $input.autocomplete({
                            source: autocompleteData,
                            minLength: 2
                        });
                    }
                }
            });
        }
    }

    var getDefaultRendering = function (ctx) {
        var templatesByType = SPClientTemplates._defaultTemplates.Fields.default.all.all;
        var currentTemplates = templatesByType[ctx.CurrentFieldSchema.Type];
        var currentRenderFunc = currentTemplates[ctx.BaseViewID];
        return currentRenderFunc(ctx);
    }

    /*
     * Create an empty overrides object.
     */
    var overrides = {
        OnPostRender: autoCompletePostRender
    };

    // register template overrides for partial page loads if MDS is enabled
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) +
            '/Style%20Library/AutocompleteCSR.js';

        RegisterModuleInit(url.toLowerCase(), function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
        });
    }

    // also register templates now for non-MDS and full page loads
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
})(jQuery);
