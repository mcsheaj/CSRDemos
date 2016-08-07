/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function () {
    /*
     * Implementation class for the overrides.
     */
    $.accordionViewer = {
        /*
         *  Register the template overrides.
         */
        registerAccordionViewTemplate: function () {
            // declare an overrides instance
            var accordionViewContext = {
                Templates: {
                    // override the header render
                    Header: function (ctx) {
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

                    // override the item render
                    Item: function (ctx) {
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

                    // override the footer render
                    Footer: " "
                },

                // wire things up in post render
                OnPostRender: function (ctx) {
                    $.accordionViewer.getCss();
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
                }
            };

            // register the overrides instance
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(accordionViewContext);
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

    // register my template overrides
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) +
            '/_catalogs/masterpage/Display Templates/List Views/AccordionViewCSR.js';
            //'/Style Library/AccordionViewCSR.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url, function () {
            $.accordionViewer.registerAccordionViewTemplate();
        });
    }

    // also just register for full page loads (F5/refresh)
    $.accordionViewer.registerAccordionViewTemplate();
})(jQuery);

