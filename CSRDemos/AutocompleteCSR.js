/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    // this array is the only thing that needs to be modified to override more or different fields
    var fields = [
        "JobTitle"
    ];

    autoCompleteRender = function(ctx) {
        var $result = $(getDefaultRendering(ctx));
        $result.find("input").addClass(ctx.ListSchema.Field[0].Name);
        return $result[0].outerHTML;
    }

    autoCompletePostRender = function(ctx) {
        if ($.inArray(ctx.ListSchema.Field[0].Name, fields) > -1) {
            var $input = $("." + ctx.ListSchema.Field[0].Name);
            $().SPServices({
                operation: "GetListItems",
                async: true,
                listName: "JobTitles",
                CAMLViewFields: "<ViewFields><FieldRef Name='Title' /></ViewFields>",
                CAMLQuery: "<Query><OrderBy><FieldRef Name='Title' Ascending='True' /></OrderBy></Query>",
                completefunc: function(xData) {
                    var autocompleteData = [];
                    $(xData.responseXML).SPFilterNode("z:row").each(function() {
                        autocompleteData.push($(this).attr("ows_Title"));
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

    var getDefaultRendering = function(ctx) {
        var templatesByType = SPClientTemplates._defaultTemplates.Fields.default.all.all;
        var currentTemplates = templatesByType[ctx.CurrentFieldSchema.Type];
        var currentRenderFunc = currentTemplates[ctx.BaseViewID];
        return currentRenderFunc(ctx);
    }

    /*
     * Create an empty overrides object.
     */
    var overrides = {
        Templates: {
            'Fields': {}
        },
        OnPostRender: autoCompletePostRender
    };

    /*
     * Add an overrides object for each field we want to customize.
     */
    for (var i = 0; i < fields.length; i++) {
        var current = fields[i];
        overrides.Templates.Fields[current] = {
            'NewForm': autoCompleteRender,
            'EditForm': autoCompleteRender
        };
    }

    // check for MDS
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) +
            '/Style%20Library/AutocompleteCSR.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url.toLowerCase(), function() {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
        });
    }

    // also just register for full page loads (F5/refresh)
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
})(jQuery);
