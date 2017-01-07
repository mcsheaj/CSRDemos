// Adapted from Office Dev PnP CSR samples by Muawiyah Shannak, @MuShannak 

(function ($) {
    var tabs = [
        ["General", ["Title", "Age", "Married", "Mobile", "SSN"]],
        ["Work", ["Manager", "Salary", "Phone", "Email"]],
        ["Other", ["Comments"]]
    ];

    var formWebPartId;

    /*
     * Insert the html/css to render the tabs into the form web part.
     */
    function preRender(ctx) {
        if (!formWebPartId) { // only do on pre render for first field
            formWebPartId = "WebPart" + ctx.FormUniqueId;

            // construct the unordered list to represent the tabs, and insert it into the web part div
            var tabsHTML = "";
            for (var i = 0; i < tabs.length; i++) {
                tabClass = "";
                if (i == 0) { tabClass = "active"; }
                tabsHTML += "<li class='{Class}'><a href='#{Index}'>{Title}</a></li>".replace(/{Index}/g, i).replace(/{Title}/g, tabs[i][0]).replace(/{Class}/g, (i == 0 ? "active" : ""));
            }
            $("#" + formWebPartId).prepend(getCss() + "<ul class='tabs'>" + tabsHTML + "</ul>");

            // add a click event handler to each of the tabs anchors.
            $('.tabs li a').on('click', function (e) {
                var currentIndex = $(this).attr('href').replace("#", "");
                showTabControls(currentIndex);
                $(this).parent('li').addClass('active').siblings().removeClass('active');
                e.preventDefault();
            });

            $(document).ready(function () {
                showTabControls(0); // set the active tab to 0
            });
        }
    }

    /*
     * As each field is rendered, add and id so it to the row to make it easy to find and hide the row.
     */
    function postRender(ctx) {
        var controlId = ctx.ListSchema.Field[0].Name + "_" + ctx.ListSchema.Field[0].Id;
        $("[id^='" + controlId + "']").closest("tr").attr('id', 'tr_' + ctx.ListSchema.Field[0].Name).hide();
    }

    /*
     * Show all fields on the indexed tab, hide all others.
     */
    function showTabControls(index) {
        $("#" + formWebPartId + " [id^='tr_']").hide();

        for (var i = 0; i < tabs[index][1].length; i++) {
            $("[id^='tr_" + tabs[index][1][i] + "']").show();
        }
    }

    var overrides = {
        OnPreRender: preRender,
        OnPostRender: postRender,
        Templates: {}
    };

    // register template overrides for partial page loads if MDS is enabled
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) + '/Style%20Library/TabbedFormCSR.js';

        RegisterModuleInit(url.toLowerCase(), function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);
        });
    }

    // also just register for non-MDS and full page loads
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(overrides);

    function getCss() {
        return (function () {/*
            <style type='text/css'>
            .tabs {
                border-bottom: 1px solid #ddd;
                content: " ";
                display: table;
                margin-bottom: 0;
                padding-left: 0;
                list-style: none;
                width: 100%;
            }

                .tabs > li {
                    float: left;
                    margin-bottom: -1px;
                    position: relative;
                    display: block;
                }

                    .tabs > li > a {
                        margin-right: 2px;
                        line-height: 1.42857143;
                        border: 1px solid transparent;
                        position: relative;
                        display: block;
                        padding: 10px 15px;
                    }

                .tabs a {
                    color: #428bca;
                    text-decoration: none;
                }

                .tabs > li.active > a, .tabs > li.active > a:hover, .tabs > li.active > a:focus {
                    color: #555;
                    background-color: #fff;
                    border: 1px solid #ddd;
                    border-bottom-color: transparent;
                    cursor: default;
                }
            </style>
         */}).toString().split('\n').slice(1, -1).join('\n');
    }
})(jQuery);

