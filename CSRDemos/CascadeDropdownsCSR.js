/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 *
 *  Cascade dropdowns using registerInitCallback.  Works regardless of the rendering order.
 */
(function ($) {
    // this structure is the only thing that needs to be modified to override more or different fields
    var fields = {
        "SalesDivision": {
            "parent": "SalesRegion",
            "child": "SalesDivision",
            "relationshipList": "SalesDivision",
            "relationshipParent": "SalesRegion",
            "relationshipChild": "Title"
        },
        "SalesState": {
            "parent": "SalesDivision",
            "child": "SalesState",
            "relationshipList": "SalesState",
            "relationshipParent": "SalesDivision",
            "relationshipChild": "Title"
        }
    };
    var keys = Object.keys(fields);

    var cascadeDropdowsRender = function (ctx) {
        var formCtx = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

        var html = getDefaultRendering(ctx);

        // init callback is called after all fields have been rendered
        formCtx.registerInitCallback(formCtx.fieldName, function (localCtx) {
            var config = fields[formCtx.fieldName];

            var options = {
                parentColumn: config.parent,
                childColumn: config.child,
                relationshipList: config.relationshipList,
                relationshipListParentColumn: config.relationshipParent,
                relationshipListChildColumn: config.relationshipChild,
                debug: true
            };

            $().SPServices.SPCascadeDropdowns(options);
        });

        return html;
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
        Templates: {
            'Fields': {}
        }
    };

    /*
     * Add an overrides object for each field we want to customize.
     */
    for (var i = 0; i < keys.length; i++) {
        var current = keys[i];
        overrides.Templates.Fields[current] = {
            'NewForm': cascadeDropdowsRender,
            'EditForm': cascadeDropdowsRender
        };
    }

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
