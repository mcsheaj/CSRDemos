(function ($) {
    // test is form with client side rendering
    if (typeof (SPClientTemplates) === 'undefined')
        return;

    var tabs = [
        ["Basic", ["Title", "FirstName", "FullName", "Company", "JobTitle", "ContentType", "BusinessUnit", "Skills"]],
        ["Address", ["WorkAddress", "WorkCity", "WorkState", "WorkZip", "WorkCountry"]],
        ["Phone", ["WorkPhone", "WorkFax", "CellPhone", "HomePhone"]],
        ["Miscellaneous", ["Email", "WebPage", "Comments", "SalesRegion", "SalesDivision", "SalesState"]]
    ];

    var formWebPartId;

    /*
     * Insert the html/css to render the tabs into the form web part.
     */
    function preRender(ctx) {
        if (!formWebPartId) { // only do on pre render for first field
            formWebPartId = "WebPart" + ctx.FormUniqueId;

            // construct the unordered list to represent the tabs, and insert it into the web part div
            var ul = $("<ul/>", { "class": "tabs" });
            for (var i = 0; i < tabs.length; i++) {
                var li = $("<li/>", { "class": (i == 0 ? "active" : "") });
                li.append($("<a/>", { "id": "anchor" + i, "href": "#" + i }).text(tabs[i][0]));
                ul.append(li);
            }
            $("#" + formWebPartId).prepend(ul);
            $("#" + formWebPartId).addClass("form-webpart").prepend(getCss());

            // add a click event handler to each of the tabs anchors.
            $('.tabs li a').on('click', function (e) {
                selectTab($(this).attr('href').replace("#", ""));
                e.preventDefault();
            });

            $(document).ready(function () {
                selectTab(0); // set the active tab to 0
            });
        }
    }

    /*
     * As each field is rendered, add and id so it to the row to make it easy to find and hide the row.
     */
    function postRender(ctx) {
        //$("[id^='" + ctx.ListSchema.Field[0].Name + "_" + ctx.ListSchema.Field[0].Id + "']").closest("tr").attr('id', 'tr_' + ctx.ListSchema.Field[0].Name).hide();
        $("td.ms-formbody").filter(function (pos, item) {
            return item.innerHTML.indexOf('FieldInternalName="' + ctx.ListSchema.Field[0].Name + '"') > 0;
        }).closest("tr").attr('id', 'tr_' + ctx.ListSchema.Field[0].Name).hide();;
    }

    /*
     * Show all fields on the selected tab, hide all others, and mark the selected tab as active.
     */
    function selectTab(index) {
        var anchor = $('#anchor' + index);
        anchor.parent('li').addClass('active').siblings().removeClass('active');

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
                    margin-bottom: 0px;
                    padding-left: 10px;
                    padding-top: 5px;
                    padding-bottom: 1px;
                    list-style: none;
                    width: 100%;
                    background: #35414f;
                    border-radius: 3px;
                    margin-top: 5px;
                }

                    .tabs > li {
                        float: left;
                        margin-bottom: -1px;
                        position: relative;
                        display: block;
                    }

                        .tabs > li > a {
                            margin-right: 4px;
                            line-height: 1.4285;
                            border: 1px solid grey;
                            position: relative;
                            display: block;
                            padding: 10px 15px;
                            border-top-left-radius: 3px;
                            border-top-right-radius: 3px;
                            background: #93c3cd;
                            color: darkslategray;
                            font-weight: bold;
                        }

                            .tabs > li > a:hover {
                                background: #e1e463;
                            }

                    .tabs a {
                        color: #428bca;
                        text-decoration: none;
                    }

                    .tabs > li.active > a, .tabs > li.active > a:hover, .tabs > li.active > a:focus {
                        color: white;
                        border: 1px solid #db4865;
                        border-bottom-color: transparent;
                        cursor: default;
                        border-top-right-radius: 5px;
                        border-top-left-radius: 5px;
                        background: #db4865;
                        font-weight: bold;
                    }

                .form-webpart {
                    border: 1px solid #93c3cd;
                    padding: 0 15px 20px 5px;
                    border-radius: 3px;
                }

                .ms-formtable {
                    margin: 15px;
                }
            </style>
         */}).toString().slice(15, -3);
    }
})(jQuery);

