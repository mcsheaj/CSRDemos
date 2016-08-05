/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
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

    /*
     * Create an empty overrides object.
     */
    var overrides = {
        OnPostRender: function(ctx) {
            if ($.inArray(ctx.ListSchema.Field[0].Name, keys) > -1) {
                var config = fields[ctx.ListSchema.Field[0].Name];

                var options = {
                    parentColumn: config.parent,
                    childColumn: config.child,
                    relationshipList: config.relationshipList,
                    relationshipListParentColumn: config.relationshipParent,
                    relationshipListChildColumn: config.relationshipChild,
                    debug: true
                };

                $().SPServices.SPCascadeDropdowns(options);
            }
        }
    };

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
