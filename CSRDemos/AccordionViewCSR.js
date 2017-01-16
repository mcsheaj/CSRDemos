/*
 *  @copyright 2016-2017 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function () {
    /*
     * Implementation class for the overrides.
     */
    var accordionViewer = {
        /*
         *  Register the template overrides.
         */
        registerAccordionViewTemplate: function () {
            // declare an overrides instance
            var overrides = {
                Templates: {
                    Header: accordionViewer.renderHeader,
                    Item: accordionViewer.renderItem,
                    Footer: " "
                },
                OnPostRender: accordionViewer.postRender
            };

            // register the overrides instance
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
        },

        /*
         * Render anchors for expand and collapse all.
         */
        renderHeader: function (ctx) {
            var $result = $("<p/>");
            $result.append($("<a/>", {
                "class": "expand",
                "href": "javascript:void(0)",
                "style": "margin-right: 10px; text-decoration: underline"
            }).text("Expand"));
            $result.append($("<a/>", {
                "class": "collapse",
                "href": "javascript:void(0)",
                "style": "text-decoration: underline"
            }).text("Collapse"));
            return $result.html();
        },

        /*
         * Render an accordion for each item.
         */
        renderItem: function (ctx) {
            var $result = $("<p/>");
            var $div = $("<div/>", {
                "class": "accordion",
                "style": "width: 800px"
            });
            $div.append($("<h3/>", {
                "class": "accordion-part",
                "style": "font-weight: bold;"
            }).text(ctx.CurrentItem.Title));
            $div.append($("<div/>", { "class": "accordion-part" }).html(ctx.CurrentItem.Body));
            $result.append($div);
            return $result.html();
        },

        /*
         * Call jquery-ui accordion and wire up the expand and collapse anchors.
         */
        postRender: function (ctx) {
            accordionViewer.getCss();
            $(".accordion").accordion({
                heightStyle: "content",
                collapsible: true,
                active: false // uncomment to start all accordions expanded
            });
            //$(".accordion").first().accordion({ active: 0 }); // uncomment to start first accordion expanded

            $(".expand").click(function () {
                $(".accordion").accordion({ active: 0 });
            });

            $(".collapse").click(function () {
                $(".accordion").accordion({ active: false });
            });
        },

        // shove a jquery-ui.css reference into the head
        getCss: function () {
            if (!$('body').attr('data-accordionviewcss')) {
                var css = _spPageContextInfo.siteAbsoluteUrl +
                    '/Style%20Library/jquery-ui.css';
                $('head').append(
                    '<link rel="stylesheet" type="text/css" href="' + css + '">');
                $('body').attr('data-accordionviewcss', 'true');
            }
        }
    };

    // register template overrides for partial page loads if MDS is enabled
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) +
            '/_catalogs/masterpage/Display Templates/List Views/AccordionViewCSR.js';

        RegisterModuleInit(url, function () {
            accordionViewer.registerAccordionViewTemplate();
        });
    }

    // also register templates now for non-MDS and full page loads
    accordionViewer.registerAccordionViewTemplate();
})(jQuery);

