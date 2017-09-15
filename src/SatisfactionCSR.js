/*
 *  @copyright 2017 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function () {
    // this array is the only thing that needs to be modified to override more/different fields
    var fields = [
        "OverallSatisfaction"
    ];

    /*
     * Implementation for the display form and views.
     */
    var display = function (ctx) {
        var satisfaction = ctx.CurrentItem[ctx.CurrentFieldSchema.Name];
        var color = "blue";

        // Return html element with appropriate color based on satisfaction value 
        switch (satisfaction) {
            case "10":
            case "9":
            case "8":
                color = "green";
                break;
            case "7":
            case "6":
                color = "yellow";
                break;
            default:
                color = "red";
        }

        var result = $("<span/>").append(
            $("<span/>").attr("class", color).text(satisfaction));

        return result.html();
    }

    /*
     * Implementation for the new and edit forms.
     */
    var edit = function (ctx) {
        var formCtx = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

        // Register a callback just before submit. 
        formCtx.registerGetValueCallback(formCtx.fieldName, function () {
            return $("#input_" + formCtx.fieldName).val();
        });

        var result = $("<input/>").
            attr("id", "input_" + formCtx.fieldName).
            attr("type", "number").
            attr("min", "1").
            attr("max", "10").
            attr("size", "2").
            attr("value", formCtx.fieldValue);

        initValidation(formCtx);

        // Render Html5 input (number) 
        return $("<span/>").append(result).html();
    }

    /*
     * Initialize validation.
     */
    var initValidation = function (current) {
        // create a validator set
        var fieldValidators = new SPClientForms.ClientValidation.ValidatorSet();

        // create a custom validator with an object literal insead of new and a constructor
        fieldValidators.RegisterValidator({
            Validate: function (value) {
                var isError = false;
                var errorMessage = '';

                if (value < 1 || value > 10) {
                    isError = true;
                    errorMessage = 'Value must be between 1 and 10.';
                }

                return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
            }
        });

        // if required, add a required field validator
        if (current.fieldSchema.Required) {
            fieldValidators.RegisterValidator(new SPClientForms.ClientValidation.RequiredValidator());
        }

        // register a callback method for the validators
        current.registerValidationErrorCallback(current.fieldName, function (error) {
            if($("#error_" + current.fieldName).length === 0) {
                $("#input_" + current.fieldName).parent().append($('<div/>', {
                    'id': "error_" + current.fieldName,
                    'class': 'ms-formvalidation'
                }));    
            }
            $("#error_" + current.fieldName).attr('role', 'alert').html(error.errorMessage);
        });

        // register the validators
        current.registerClientValidator(current.fieldName, fieldValidators);
    }

    var formWebPartId;
    var preRender = function (ctx) {
        if (!formWebPartId) {
            formWebPartId = "WebPart" + ctx.FormUniqueId;
            $("body").prepend(getCss());
        }
    }

    /*
     * Create an empty overrides object.
     */
    var overrides = {
        Templates: {
            OnPreRender: preRender,
            'Fields': {}
        }
    };

    /*
     * Add an overrides object for each field we want to customize.
     */
    for (var i = 0; i < fields.length; i++) {
        var current = fields[i];
        overrides.Templates.Fields[current] = {
            'NewForm': edit,
            'EditForm': edit,
            'DisplayForm': display,
            'View': display
        };
    }

    // register template overrides for partial page loads if MDS is enabled
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl).toLowerCase();
        RegisterModuleInit(url + '/style%20library/satisfactioncsr.js', function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
        });
    }

    // register the template overrides
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);

    var getCss = function () {
        return (function () {/*
            <style type='text/css'>
            .green {
                font-weight: bold;
                color: green;
            }
            .yellow {
                font-weight: bold;
                color: yellow;
            }
            .red {
                font-weight: bold;
                color: red;
            }
            </style>
         */}).toString().slice(15, -3);
    }
})();
