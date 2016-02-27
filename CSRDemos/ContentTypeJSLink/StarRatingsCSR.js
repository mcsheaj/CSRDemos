/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    if (typeof (SPClientTemplates) === 'undefined')
        return;

    starRatingFields = [
        'Content1',
        'Relevance',
        'Presentation'
    ];

    /*
     * Implementation class for the overrides.
     */
    $.starRatingImpl = {
        /*
         * Implementation for the display form and views.
         */
        displayMethod: function (ctx) {
            $.starRatingImpl.getCss();

            var result = $('<div/>', {
                'id': ctx.CurrentFieldSchema.Name,
                'class': 'csrdemos-stars',
                'data-value': ctx.CurrentItem[ctx.CurrentFieldSchema.Name]
            });

            //result.addClass('csrdemos-' + ctx.CurrentFieldValue + 'stars');
            result.addClass('csrdemos-' + ctx.CurrentItem[ctx.CurrentFieldSchema.Name] + 'stars');

            return result.prop('outerHTML');
        },

        /*
         * Implementation for the new and edit forms.
         */
        inputMethod: function (ctx) {
            $.starRatingImpl.getCss();

            var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

            // register a callback to return the current value
            current.registerGetValueCallback(
                current.fieldName,
                $.starRatingImpl.getFieldValue.bind($.starRatingImpl, current.fieldName));

            // create a validator set
            var fieldValidators = new SPClientForms.ClientValidation.ValidatorSet();
            fieldValidators.RegisterValidator(new starRatingsFieldValidator());

            // if required, add a required field validator
            if (current.fieldSchema.Required) {
                fieldValidators.RegisterValidator(new SPClientForms.ClientValidation.RequiredValidator());
            }

            // register a callback method for the validators
            current.registerValidationErrorCallback(current.fieldName, function (error) {
                $('#' + current.fieldName + 'Error').attr('role', 'alert').html(error.errorMessage);
            });

            // register the validators
            current.registerClientValidator(current.fieldName, fieldValidators);

            // construct the html for our control and return it
            var result = $('<p />');
            result.append($('<div/>', {
                'id': current.fieldName,
                'class': 'csrdemos-stars csrdemos-' + ctx.CurrentFieldValue + 'stars',
                'data-value': ctx.CurrentFieldValue,
                'onclick': '$.starRatingImpl.handleClickOnStarRating(event)'
            }));
            result.append($('<span/>', {
                'id': current.fieldName + 'Error',
                'class': 'ms-formvalidation ms-csrformvalidation'
            }));

            return result.html();
        },

        /*
         * Return the current value from the data-value attribute of my div.
         */
        getFieldValue: function (fieldName) {
            return $('#' + fieldName).attr('data-value');
        },

        /*
         * Shove a link to the stylesheet into the DOM one time.
         */
        getCss: function () {
            if (!$('body').attr('data-starcssadded')) {
                var css = _spPageContextInfo.siteAbsoluteUrl +
                    '/Style Library/ContentTypeJSLink/starratings.css';
                $('head').append(
                    '<link rel="stylesheet" type="text/css" href="' + css + '">');
                $('body').attr('data-starcssadded', 'true');
            }
        },

        /*
         * Onclick callback; set the current value by determining which star
         * was clicked upon.
         */
        handleClickOnStarRating: function (e) {
            var div = $(e.target);
            var posX = div.offset().left;
            var stars = Math.floor((e.pageX - posX + (div.height() / 2)) / div.height());
            div.attr('class', 'csrdemos-stars');
            div.addClass('csrdemos-' + stars + 'stars');
            div.attr('data-value', stars);
        }
    };

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
     * Create overrides for the new, edit, and display forms and views for the star ratings field.
     */
    $.starRatingOverrides = {
        Templates: {
            'Fields': {
            }
        }
    };
    $.each($(starRatingFields), function (i, v) {
        $.starRatingOverrides.Templates.Fields[v] = {
            'View': $.starRatingImpl.displayMethod,
            'DisplayForm': $.starRatingImpl.displayMethod,
            'NewForm': $.starRatingImpl.inputMethod,
            'EditForm': $.starRatingImpl.inputMethod
        };
    });


    // register my template overrides
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = _spPageContextInfo.siteServerRelativeUrl +
            '/Style Library/ContentTypeJSLink/starratingscsr.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url, function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides($.starRatingOverrides);
        });
        // also just register for full page loads (F5/refresh)
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides($.starRatingOverrides);
    } else {
        // if no _spPageContextInfo, then this is a full page load regardless of 
        // MDS being enabled or not, so just register normally
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides($.starRatingOverrides);
    }
})(jQuery);

