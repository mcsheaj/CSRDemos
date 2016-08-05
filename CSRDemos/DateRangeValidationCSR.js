(function($) {
    // this structure is the only thing that needs to be modified to override more or different fields
    var fields = {
        "_EndDate": "StartDate"
    };

    var keys = Object.keys(fields);

    dateRangeValidationRender = function(ctx) {
        var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);
        var name = ctx.ListSchema.Field[0].Name;
        
        // create a validator set
        var fieldValidators = new SPClientForms.ClientValidation.ValidatorSet();

        // create a custom validator with an object literal insead of new and a constructor
        fieldValidators.RegisterValidator({
            Validate: function(value) {
                var isError = false;
                var errorMessage = '';
                if (value.length > 0) {
                    var config = fields[name];

                    // get the start date 
                    var startDateStr = $("input[id^='" + config + "'][id$='DateTimeFieldDate']").val();
                    if (startDateStr.length === 0) {
                        isError = true;
                        errorMessage = "You cannot enter '" + name + "' without also entering '" + config + "'.";
                    } else {
                        sd = new Date(startDateStr);
                        ed = new Date(value);
                        if (ed < sd) {
                            isError = true;
                            errorMessage = "'" + name + "' must be greater than or equal to '" + config + "'.";
                        }
                    }
                }
                return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
            }
        });

        // if required, add a required field validator
        if (current.fieldSchema.Required) {
            fieldValidators.RegisterValidator(new SPClientForms.ClientValidation.RequiredValidator());
        }

        // register a callback method for the validators
        current.registerValidationErrorCallback(current.fieldName, function(error) {
            $td = $("input[id^='" + current.fieldName + "'][id$='DateTimeFieldDate']").closest("td");
            if (td.find("span[role='alert']").length > 0) {
                td.find("span[role='alert']").html(error.errorMessage);
            } else {
                td.append($("<span/>", { role: "alert" }).html(error.errorMessage));
            }
        });

        // register the validators
        current.registerClientValidator(current.fieldName, fieldValidators);

        return getDefaultRendering(ctx);
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
        }
    };

    /*
     * Add an overrides object for each field we want to customize.
     */
    for (var i = 0; i < keys.length; i++) {
        var current = keys[i];
        overrides.Templates.Fields[current] = {
            'NewForm': dateRangeValidationRender,
            'EditForm': dateRangeValidationRender
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
