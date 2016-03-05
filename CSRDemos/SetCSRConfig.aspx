<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    CSR Configuration
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitleInTitleArea' runat='server'>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderAdditionalPageHead' runat='server'>
    <meta name='CollaborationServer' content='SharePoint Team Web Site' />
    <style type="text/css">
        .nobr {
            white-space: nowrap;
        }

        #DeltaPageStatusBar {
            display: none;
        }

        .csr-fields {
            width: 800px;
            margin-bottom: 20px;
        }

        th.name, th.display {
            width: 300px;
        }

        th.type {
            width: 180px;
        }

        th.delete {
            width: 20px;
        }

        .ui-icon-closethick {
            cursor: pointer;
        }

        .ui-widget {
            font-size: .9em !important;
        }

        .ui-button {
            margin: 15px 0;
        }

        .formtable {
            margin: 20px;
        }

        #content {
            display: none;
        }
    </style>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderMiniConsole' runat='server'>
    <SharePoint:FormComponent TemplateName='WikiMiniConsole' ControlMode='Display' runat='server' id='WikiMiniConsole'></SharePoint:FormComponent>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderLeftActions' runat='server'>
    <SharePoint:RecentChangesMenu runat='server' id='RecentChanges'></SharePoint:RecentChangesMenu>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderMain' runat='server'>
    <div id="content">
        <h3>Add CSR</h3>
        <table class="formtable">
            <tr>
                <td>CSR Type: </td>
                <td>
                    <select id="csrType">
                        <option></option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>Field: </td>
                <td>
                    <select id="field">
                        <option></option>
                    </select>
                </td>
            </tr>
            <tr>
                <td></td>
                <td>
                    <button id="addCsr" type="button">Add CSR</button>
                    <button id="save" type="button">Save</button>
                </td>
            </tr>
        </table>
        <div id="csrModuleTables"></div>
    </div>
    <script type="text/javascript">
        (function ($) {
            if (typeof ($.csrConfig) === "undefined") {
                $.csrConfig = { };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Code in fron class for the form.
            ////////////////////////////////////////////////////////////////////////////////
            var csrConfigSetter = {
                ////////////////////////////////////////////////////////////////////////////////
                // Main entry point, needs to be called after SharePoint context is prepared.
                ////////////////////////////////////////////////////////////////////////////////
                init: function () {
                    // get the context
                    csrConfigSetter.ctx = new SP.ClientContext.get_current();
                    csrConfigSetter.web = csrConfigSetter.ctx.get_web();

                    // load the site columns
                    csrConfigSetter.fields = csrConfigSetter.web.get_availableFields();
                    csrConfigSetter.ctx.load(csrConfigSetter.fields);

                    // exec the query async
                    csrConfigSetter.ctx.executeQueryAsync(
                        function () {
                            // on success enumerate the fields and initialize the form controls
                            csrConfigSetter.enumerateFields();

                            // for each module, add an option to the csrType select, and display the current configuration
                            $.each(Object.keys($.csrConfig.csrModules), function (i, k) {
                                var csrModule = $.csrConfig.csrModules[k];
                                $("#csrType").append($("<option/>", { "value": csrModule.name }).text(csrModule.displayName));
                                csrConfigSetter.drawCSRTable(csrModule);
                            });

                            // when the csr type select changes, change the select of available fields for that the new type
                            csrConfigSetter.wireCsrTypeSelect();

                            // when the field select changes, enable/disable the add button
                            csrConfigSetter.wireFieldSelect();

                            // when clicked, add a row to the appropriate table and clear selects 
                            csrConfigSetter.wireAddCsrButton();

                            // when clicked, post the CSRConfig.js file and clear selects
                            csrConfigSetter.wireSaveButton();

                            // when click, remove the table row
                            csrConfigSetter.wireDeleteButtons();

                            $("#content").show();
                        },
                        function () {
                            alert("Could not load site columns.")
                        }
                    );
                },

                ////////////////////////////////////////////////////////////////////////////////
                // When the csr type is changed, change options in the field select so that 
                // only fields appropriate to the current csr type are available.
                ////////////////////////////////////////////////////////////////////////////////
                wireCsrTypeSelect: function () {
                    $("#csrType").change(function (e) {
                        $("#field").html("<option></option>");
                        if (csrConfigSetter[e.target.value]) {
                            var a = csrConfigSetter.getConfig(e.target.value + "Table");
                            $.each($(Object.keys(csrConfigSetter[e.target.value]).sort()), function (i, k) {
                                if ($.inArray(k, a) < 0) {
                                    var v = csrConfigSetter[e.target.value][k];
                                    $("#field").append("<option value='" + v.name + "'>" + v.name + " [" + v.displayName + "]" + "</option>");
                                }
                            });
                        }
                        $("#addCsr").button("option", "disabled", true);
                    });
                },

                ////////////////////////////////////////////////////////////////////////////////
                // When the current field changes, enable/disable the add button.
                ////////////////////////////////////////////////////////////////////////////////
                wireFieldSelect: function () {
                    $("#field").change(function (e) {
                        if (e.target.value.length > 0) {
                            $("#addCsr").button("option", "disabled", false);
                        }
                        else {
                            $("#addCsr").button("option", "disabled", true);
                        }
                    });
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Add a row to the appropriate table, the tables are the config.
                ////////////////////////////////////////////////////////////////////////////////
                wireAddCsrButton: function () {
                    $("#addCsr").button({
                        icons: {
                            primary: "ui-icon-plus"
                        },
                        text: true
                    }).click(function () {
                        var csrModule = $.csrConfig.csrModules[$("#csrType").val()];
                        var v = csrConfigSetter[csrModule.name][$("#field").val()];
                        var table = $("#" + csrModule.name + "Table");
                        var row = $("<tr/>", { "class": "config" });
                        row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.name)));
                        row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.displayName)));
                        row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.type)));
                        row.append(($("<td/>").html("<span class='ui-button-icon-primary ui-icon ui-icon-closethick'></span>")))
                        table.append(row);
                        table.find("tr.empty").remove();
                        $("#csrType").val("");
                        $("#field").html("<option></option>");
                        $("#addCsr").button("option", "disabled", true);
                        $("#save").button("option", "disabled", false);
                    });
                    $("#addCsr").button("option", "disabled", true);

                },

                ////////////////////////////////////////////////////////////////////////////////
                // Reverse engineer the tables into JSON and post the CSRConfig.js file back
                // to the style library.
                ////////////////////////////////////////////////////////////////////////////////
                wireSaveButton: function () {
                    $("#save").button({
                        icons: {
                            primary: "ui-icon-disk"
                        },
                        text: true
                    }).click(function () {
                        $.csrConfig.entityEditorFields = csrConfigSetter.getConfig("entityEditorTable");
                        $.csrConfig.starRatingFields = csrConfigSetter.getConfig("starRatingTable");
                        var contents = "(function ($) {\n\n";
                        contents += "$.csrConfig = " + JSON.stringify($.csrConfig, null, 4);
                        contents += "\n\n\n})(jQuery);\n";

                        $.ajax({
                            url: csrConfigSetter.siteRelativePathAsAbsolutePath("/Style Library/CSRConfig.js"),
                            type: "PUT",
                            headers: {
                                "Content-Type": "text/plain",
                                "Overwrite": "T"
                            },
                            data: contents,
                            success: function () {
                                $("#save").button("option", "disabled", true);
                                alert("Successfully saved the configuration.");
                            },
                            error: function (xhr, ajaxOptions, thrownError) {
                                alert("Oops, something bad happened.");
                            }
                        });
                    });
                    $("#save").button("option", "disabled", true);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Delete a row from one of the configuration tables.
                ////////////////////////////////////////////////////////////////////////////////
                wireDeleteButtons: function () {
                    $(".csr-fields").on("click", ".ui-icon-closethick", function (e) {
                        var span = $(e.target);
                        var table = span.closest("table");
                        var tr = span.closest("tr");
                        tr.remove();
                        $("#csrType").val("");
                        if (table.find("td").length === 0) {
                            table.append((
                                $("<tr/>", { "class": "empty" }).html("<td class='ui-widget-content ui-corner-all nobr' colspan='3'>There currently are no fields configured to use this CSR.</td>")
                            ));
                        }
                        $("#save").button("option", "disabled", false);
                    });
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Reverse engineer a single table into JSON.
                ////////////////////////////////////////////////////////////////////////////////
                getConfig: function (id) {
                    var result = [];
                    var table = $("#" + id);
                    $.each(table.find("tr.config"), function (i, tr) {
                        result.push($($(tr).children()[0]).text());
                    });
                    return result;
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Construct and inject a single configuration table into the DOM.
                ////////////////////////////////////////////////////////////////////////////////
                drawCSRTable: function (csrModule) {
                    var div = $("#csrModuleTables");
                    div.append($("<h3/>").text(csrModule.displayName + " Fields"));
                    var table = $("<table/>", { "id": csrModule.name + "Table", "class": "csr-fields" });
                    div.append(table);

                    var headers = $("<tr/>");
                    headers.append($("<th/>", { "class": "name ui-widget-header ui-corner-all nobr" }).text("Internal Name"));
                    headers.append($("<th/>", { "class": "displayname ui-widget-header ui-corner-all nobr" }).text("DisplayName"));
                    headers.append($("<th/>", { "class": "type ui-widget-header ui-corner-all nobr" }).text("Field Type"));
                    headers.append($("<th/>", { "class": "delete" }));
                    table.append(headers);

                    var config = $.csrConfig[csrModule.name + "Fields"];
                    $.each($(config), function (i, k) {
                        var v = csrConfigSetter[csrModule.name][k];
                        if (typeof (v) !== "undefined") {
                            var row = $("<tr/>", { "class": "config" });
                            row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.name)));
                            row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.displayName)));
                            row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.type)));
                            row.append(($("<td/>").html("<span class='ui-button-icon-primary ui-icon ui-icon-closethick'></span>")))
                            table.append(row);
                        }
                    });
                    if (table.find("td").length === 0) {
                        table.append((
                            $("<tr/>", { "class": "empty" }).html("<td class='ui-widget-content ui-corner-all nobr' colspan='3'>There currently are no fields configured to use this CSR.</td>")
                        ));
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Enumerate the site columns and store information about them.
                ////////////////////////////////////////////////////////////////////////////////
                enumerateFields: function () {
                    var enumerator = csrConfigSetter.fields.getEnumerator();
                    while (enumerator.moveNext()) {
                        var current = enumerator.get_current();
                        var tmp = {}
                        tmp.name = current.get_internalName();
                        tmp.displayName = current.get_title();
                        tmp.type = current.get_typeDisplayName();
                        $.each(Object.keys($.csrConfig.csrModules), function (i, k) {
                            var csrModule = $.csrConfig.csrModules[k];
                            if ($.inArray(tmp.type, csrModule.types) > -1) {
                                if (!csrConfigSetter[csrModule.name]) {
                                    csrConfigSetter[csrModule.name] = [];
                                }
                                csrConfigSetter[csrModule.name][tmp.name] = tmp;
                            }
                        });
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Utility method to conver a site relative path to an absolute path. i.e.
                // converts 'Style Library/CSRConfig.js' => '/sites/yoursite/Style Library/CSRConfig.js'.
                // Seems pretty simple, but if you're in the root web and your not careful,
                // you'll get bit.
                ////////////////////////////////////////////////////////////////////////////////
                siteRelativePathAsAbsolutePath: function (path) {
                    var site = _spPageContextInfo.siteServerRelativeUrl;
                    if (path[0] !== '/') {
                        path = '/' + path;
                    }
                    if (site !== '/') {
                        path = site + path;
                    }
                    return path;
                }
            };

            $("head").append('<link rel="stylesheet" type="text/css" href="' + csrConfigSetter.siteRelativePathAsAbsolutePath("/Style Library/jquery-ui.css") + '">')

            SP.SOD.executeFunc("sp.js", "SP.ClientContext", function () {
                csrConfigSetter.init();
            });
        })(jQuery);
    </script>
</asp:Content>
