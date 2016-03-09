(function() {
    $.accordionViewer = {
        registerAccordionViewTemplate: function() {
            var accordionViewContext = {
                Templates: {
                    Header: "<span></span>",
                    Footer: " ",
                    Item: function(ctx) {
                        var result = $("<p/>");
                        var div = $("<div/>", {
                            "class": "accordion",
                            "style": "width: 800px"
                        });
                        div.append($("<h3/>", {
                            "class": "accordion-part"
                        }).text(ctx.CurrentItem.Title));
                        div.append($("<div/>", {
                            "class": "accordion-part"
                        }).html(ctx.CurrentItem.Body));
                        result.append(div);
                        return result.html();
                    }
                },

                OnPostRender: function(ctx) {
                    $.accordionViewer.getCss();
                    $(".accordion").accordion({
                        heightStyle: "content",
                        collapsible: true,
                        active: false
                    });
                    //$(".accordion").first().accordion({ active: 0 });
                }
            };

            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(accordionViewContext);
        },

        getCss: function() {
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
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url, function() {
            $.accordionViewer.registerAccordionViewTemplate();
        });
        // also just register for full page loads (F5/refresh)
        $.accordionViewer.registerAccordionViewTemplate();
    } else {
        // if no _spPageContextInfo, then this is a full page load regardless of 
        // MDS being enabled or not, so just register normally
        $.accordionViewer.registerAccordionViewTemplate();
    }

})(jQuery);
