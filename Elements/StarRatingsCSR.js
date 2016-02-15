(function ($) {
    $.starRating = $.starRating || {};

    /*
     * Create overrides for the new, edit, and display forms and views for the star ratings field.
     */
    var starRating = {
        Templates: {
            'Fields': {
                'StarRating': {
                    'View': displayMethod,
                    'DisplayForm': displayMethod,
                    'NewForm': inputMethod,
                    'EditForm': inputMethod
                }
            }
        }
    };

    /*
     * Implementation for the display form and views.
     */
    function displayMethod(ctx) {
        getCss();

        var result = $('<div/>', {
            'id': ctx.CurrentFieldSchema.Name,
            'class': 'csrdemos-stars',
            'data-value': ctx.CurrentItem.StarRating
        });

        // this works for display, but is undefined for view
        //result.addClass('csrdemos-' + ctx.CurrentFieldValue + 'stars');
        result.addClass('csrdemos-' + ctx.CurrentItem[ctx.CurrentFieldSchema.Name] + 'stars');

        return result.prop('outerHTML');
    }

    /*
     * Implementation for the new and edit forms.
     */
    function inputMethod(ctx) {
        getCss();

        var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

        // register a callback to return the current value
        current.registerGetValueCallback(
            current.fieldName,
            getFieldValue.bind(null, current.fieldName));

        // create a validator set
        var fieldValidators = new SPClientForms.ClientValidation.ValidatorSet();
        fieldValidators.RegisterValidator(new starRatingsFieldValidator());

        // if required, add a required field validator
        if (current.fieldSchema.Required) {
            fieldValidators.RegisterValidator(new SPClientForms.ClientValidation.RequiredValidator());
        }

        current.registerValidationErrorCallback(current.fieldName, function (error) {
            $('#' + current.fieldName + 'Error').attr('role', 'alert').html(error.errorMessage);
        });
        current.registerClientValidator(current.fieldName, fieldValidators);

        // construct the html for our control and return it
        var result = $('<p />');
        result.append($('<div/>', {
            'id': current.fieldName,
            'class': 'csrdemos-stars csrdemos-' + ctx.CurrentFieldValue + 'stars',
            'data-value': ctx.CurrentFieldValue,
            // this handler must be globally accessible
            'onclick': '$.starRating.handleClickOnStarRating(event)'
        }));
        result.append($('<span/>', {
            'id': current.fieldName + 'Error',
            'class': 'ms-formvalidation ms-csrformvalidation'
        }));

        return result.html();
    }

    /*
     * A custom validator is just an object with a Validate method. It takes in the
     * value and returns an error based on whatever criteria it chooses; in this case
     * berating people for a wishy-washy answer (i.e. 3).
     */
    var starRatingsFieldValidator = function () {
        starRatingsFieldValidator.prototype.Validate = function (value) {
            var isError = false;
            var errorMessage = '';

            if (value == '3') {
                isError = true;
                errorMessage = 'Don\'t be mealy-mouthed, take a stand!';
            }

            return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
        };
    };


    /*
     * Return the current value from the data-value attribute of my div.
     */
    function getFieldValue(fieldName) {
        return $('#' + fieldName).attr('data-value');
    }

    /*
     * Onclick callback; set the current value by determining which star
     * was clicked upon.
     */
    $.starRating.handleClickOnStarRating = function (e) {
        var div = $(e.target);
        var posX = div.offset().left;
        var stars = Math.floor((e.pageX - posX + (div.height() / 2)) / div.height());
        div.attr('class', 'csrdemos-stars');
        div.addClass('csrdemos-' + stars + 'stars');
        div.attr('data-value', stars);
    }

    /*
     * Shove a link to the stylesheet into the DOM one time.
     */
    function getCss() {
        if (!$('body').attr('data-starcssadded')) {
            var css = _spPageContextInfo.siteAbsoluteUrl +
                '/Style Library/StarRatingsCSR/starratings.css';
            $('head').append(
                '<link rel="stylesheet" type="text/css" href="' + css + '">');
            $('body').attr('data-starcssadded', 'true');
        }
    }

    // register my template overrides
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = _spPageContextInfo.siteServerRelativeUrl +
            '/Style Library/StarRatingsCSR/starratingscsr.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url, function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(starRating);
        });
        // also just register for full page loads (F5/refresh)
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(starRating);
    } else {
        // if no _spPageContextInfo, then this is a full page load regardless of 
        // MDS being enabled or not, so just register normally
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(starRating);
    }
})(jQuery);

