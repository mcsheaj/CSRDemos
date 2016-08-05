(function() {
    // this array is the only thing that needs to be modified to override more or different fields
    var fields = [
        "JobTitle",
        "WorkAddress",
        "SalesRegion",
        "StartDate"
    ];

    passThroughOverride = function(ctx) {
        // get the default templates for each field type
        var templatesByType = SPClientTemplates._defaultTemplates.Fields.default.all.all;
        // get the default templates for the current field type
        var currentTemplates = templatesByType[ctx.CurrentFieldSchema.Type];
        // get the render function by view id (i.e. NewForm, View, etc.)
        var currentRenderFunc = currentTemplates[ctx.BaseViewID];
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
            'NewForm': passThroughOverride,
            'EditForm': passThroughOverride,
            'DisplayForm': passThroughOverride
        };
    }

    // also just register for full page loads (F5/refresh)
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
})();
