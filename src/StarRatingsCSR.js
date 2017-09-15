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
            var result = $('<p />');
            result.append($('<div/>', {
                'id': 'starRating_' + ctx.CurrentFieldSchema.Name,
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
            var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

            // construct the html for our control and return it
            var result = $('<p />');
            result.append($('<div/>', {
                'id': 'starRating_' + ctx.CurrentFieldSchema.Name,
                'class': 'csrdemos-stars csrdemos-' + $.starRatingImpl.normalizeValue(ctx.CurrentFieldValue) + 'stars',
                'data-value': ctx.CurrentFieldValue,
                'onclick': '$.starRatingImpl.handleClickOnStarRating(event)'
            }));
            result.append($('<span/>', {
                'id': current.fieldName + 'Error',
                'class': 'ms-formvalidation'
            }));

            // register a callback to return the current value
            current.registerGetValueCallback(current.fieldName, function () {
                return $.starRatingImpl.getFieldValue(current);
            });

            return result.html();
        },

        /*
         * Return the current value from the data-value attribute of my div.
         */
        getFieldValue: function (current) {
            return $.starRatingImpl.normalizeValue($('#starRating_' + current.fieldName).attr('data-value'));
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
    
    var formWebPartId;
    starRatingOverrides.OnPreRender = function(ctx) {
        if(!formWebPartId) {
            formWebPartId = "WebPart" + ctx.FormUniqueId;
            $("body").prepend(starRatingsCss);
        }
    }

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
    
    var starRatingsCss = (function() {
        /*
<style type='text/css'>
.csrdemos-stars {
    width: 110px;
    height: 20px;
    background-position: left top;
    background-image: url(data:image/png;base64,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);
}

.csrdemos-1stars {
    background-position: 0 20px;
}

.csrdemos-2stars {
    background-position: 0 40px;
}

.csrdemos-3stars {
    background-position: 0 60px;
}

.csrdemos-4stars {
    background-position: 0 80px;
}

.csrdemos-5stars {
    background-position: 0 100px;
}
</style>
        */
    }).toString().slice(26, -9);
})(jQuery);

