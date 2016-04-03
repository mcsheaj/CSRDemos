/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    // test is form with client side rendering
    if (typeof (SPClientTemplates) === 'undefined')
        return;

    // test at least one field is configured to use the star rating client side rendering
    if (typeof ($.csrConfig) !== 'object' || typeof ($.csrConfig.starRatingFields) !== 'object' || !$.csrConfig.starRatingFields.length)
        return;

    /*
     * Implementation class for the overrides.
     */
    $.starRatingImpl = {
        /*
         * Implementation for the display form and views.
         */
        displayMethod: function (ctx) {
            $.starRatingImpl.getCss();

            var result = $('<p />');
            result.append($('<div/>', {
                'id': ctx.CurrentFieldSchema.Name,
                //'class': 'csrdemos-stars csrdemos-' + $.starRatingImpl.normalizeValue(ctx.CurrentFieldValue) + 'stars',
                'class': 'csrdemos-stars csrdemos-' + $.starRatingImpl.normalizeValue(ctx.CurrentItem[ctx.CurrentFieldSchema.Name]) + 'stars',
                'data-value': ctx.CurrentItem[ctx.CurrentFieldSchema.Name]
            }));

            return result.html();
        },

        /*
         * Implementation for the new and edit forms.
         */
        inputMethod: function (ctx) {
            $.starRatingImpl.getCss();

            var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

            // construct the html for our control and return it
            var result = $('<p />');
            result.append($('<div/>', {
                'id': current.fieldName,
                'class': 'csrdemos-stars csrdemos-' + $.starRatingImpl.normalizeValue(ctx.CurrentFieldValue) + 'stars',
                'data-value': ctx.CurrentFieldValue,
                'onclick': '$.starRatingImpl.handleClickOnStarRating(event)'
            }));
            result.append($('<span/>', {
                'id': current.fieldName + 'Error',
                'class': 'ms-formvalidation'
            }));

            // register a callback to return the current value
            current.registerGetValueCallback(
                current.fieldName,
                $.starRatingImpl.getFieldValue.bind(null, current.fieldName));

            return result.html();
        },

        /*
         * Return the current value from the data-value attribute of my div.
         */
        getFieldValue: function (fieldName) {
            return $.starRatingImpl.normalizeValue($('#' + fieldName).attr('data-value'));
        },

        /*
         * Reduce value to 0 to 5.
         */
        normalizeValue: function (value) {
            var result = parseInt(value);
            if (result > 5) {
                result = 5;
            }
            else if (result < 0) {
                result = 0;
            }
            return result.toString();
        },

        /*
         * Shove a link to the stylesheet into the DOM one time.
         */
        getCss: function () {
            if (!$('body').attr('data-starcssadded')) {
                var css = _spPageContextInfo.siteAbsoluteUrl +
                    '/Style%20Library/starratings.css';
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
     * Create an empty overrides object.
     */
    var starRatingOverrides = {
        Templates: {
            'Fields': {}
        }
    };

    /*
     * Add an overrides object for each field we want to customize.
     */
    $.each($($.csrConfig.starRatingFields), function (i, v) {
        starRatingOverrides.Templates.Fields[v] = {
            'View': $.starRatingImpl.displayMethod,
            'DisplayForm': $.starRatingImpl.displayMethod,
            'NewForm': $.starRatingImpl.inputMethod,
            'EditForm': $.starRatingImpl.inputMethod
        };
    });

    // register my template overrides
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) +
            '/Style%20Library/StarRatingsCSR.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url.toLowerCase(), function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(starRatingOverrides);
        });
    }

    // also just register for full page loads (F5/refresh)
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(starRatingOverrides);
})(jQuery);

