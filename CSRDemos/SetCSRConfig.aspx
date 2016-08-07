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
    <script type="text/javascript" src="jquery.js"></script>
    <script type="text/javascript" src="jquery-ui.js"></script>
    <script type="text/javascript" src="CSRConfig.js"></script>
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

            if (!$.csrConfig.csrModules) {
                $.csrConfig.csrModules = {
                    entityEditor: {
                        name: "entityEditor",
                        displayName: "Entity Editor",
                        types: ["Choice"],
                        jsLink: [
                            "~sitecollection/Style Library/CSRConfig.js",
                            "~sitecollection/Style Library/EntityEditorCSR.js"
                        ],
                        scriptLinks: [
                            "~sitecollection/Style Library/jquery.js",
                            "~sitecollection/Style Library/jquery-ui.js"
                        ]
                    },
                    starRating: {
                        name: "starRating",
                        displayName: "Star Rating",
                        types: ["Number"],
                        jsLink: [
                            "~sitecollection/Style Library/CSRConfig.js",
                            "~sitecollection/Style Library/StarRatingsCSR.js"
                        ],
                        scriptLinks: [
                            "~sitecollection/Style Library/jquery.js"
                        ]
                    }
                };
            }

            ////////////////////////////////////////////////////////////////////////////////
            // Code in fron class for the form.
            ////////////////////////////////////////////////////////////////////////////////
            var csrConfigSetter = {
                toDelete: [],

                ////////////////////////////////////////////////////////////////////////////////
                // Main entry point, needs to be called after SharePoint context is prepared.
                ////////////////////////////////////////////////////////////////////////////////
                init: function () {
                    csrConfigSetter.initClientContext(function () {
                        // load the site columns
                        csrConfigSetter.fields = csrConfigSetter.web.get_availableFields();
                        csrConfigSetter.clientContext.load(csrConfigSetter.fields);

                        // exec the query async
                        csrConfigSetter.clientContext.executeQueryAsync(
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
                    });
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
                        if ($.inArray(v.name, csrConfigSetter.toDelete) > -1) {
                            csrConfigSetter.toDelete.splice($.inArray(v.name, csrConfigSetter.toDelete), 1);
                        }
                        var $table = $("#" + csrModule.name + "Table");
                        var $row = $("<tr/>", { "class": "config" });
                        $row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.name)));
                        $row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.displayName)));
                        $row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.type)));
                        $row.append(($("<td/>").html("<span class='ui-button-icon-primary ui-icon ui-icon-closethick'></span>")))
                        $table.append($row);
                        $table.find("tr.empty").remove();
                        $("#field").find("option").first().attr("selected", "selected");
                        $("#field").find("option[value='" + v.name + "']").remove();
                        $("#addCsr").button("option", "disabled", true);
                        $("#save").button("option", "disabled", false);
                    });
                    $("#addCsr").button("option", "disabled", true);

                },

                ////////////////////////////////////////////////////////////////////////////////
                // Delete a row from one of the configuration tables.
                ////////////////////////////////////////////////////////////////////////////////
                wireDeleteButtons: function () {
                    $(".csr-fields").on("click", ".ui-icon-closethick", function (e) {
                        var span = $(e.target);
                        var $table = span.closest("table");
                        var tr = span.closest("tr");
                        var name = $(tr.children()[0]).text();
                        if ($.inArray(name, csrConfigSetter.toDelete) < 0) {
                            csrConfigSetter.toDelete.push(name);
                        }
                        tr.remove();
                        $("#csrType").val("");
                        if ($table.find("td").length === 0) {
                            $table.append((
                                $("<tr/>", { "class": "empty" }).html("<td class='ui-widget-content ui-corner-all nobr' colspan='3'>There currently are no fields configured to use this CSR.</td>")
                            ));
                        }
                        $("#save").button("option", "disabled", false);
                    });
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
                        $.each(Object.keys($.csrConfig.csrModules), function (i, k) {
                            var m = $.csrConfig.csrModules[k];
                            $.csrConfig[m.name + "Fields"] = csrConfigSetter.getConfig(m.name + "Table");
                        });

                        var contents = "(function ($) {\n\n";
                        contents += "$.csrConfig = " + JSON.stringify($.csrConfig, null, 4);
                        contents += "\n\n\n})(jQuery);\n";
                        contents = contents.replace(/\r?\n/g, "\r\n");

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
                                csrConfigSetter.injectScripts();
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
                // Setup and ScriptLinks and/or JSLink required for the currently configured
                // fields.
                ////////////////////////////////////////////////////////////////////////////////
                injectScripts: function () {
                    var scripts = csrConfigSetter.getScripts();
                    csrConfigSetter.injectScriptLinks(scripts.scriptLinks);
                    csrConfigSetter.injectJSLink(scripts.jsLink);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Return a structure of all ScriptLinks and JSLink currently configure (and de-duped).
                ////////////////////////////////////////////////////////////////////////////////
                getScripts: function () {
                        var result = {};
                        result.jsLink = {};
                        result.scriptLinks = [];
                        $.each(Object.keys($.csrConfig.csrModules), function (i, k) {
                            var fields = $.csrConfig[k + "Fields"];
                            var module = $.csrConfig.csrModules[k];
                            if (fields.length > 0) {
                                $.each($(fields), function (j, f) {
                                    result.jsLink[f] = result.jsLink[f] ? merge(result.jsLink[f], module.jsLink) : module.jsLink;
                                });

                                result.scriptLinks = csrConfigSetter.merge(result.scriptLinks, module.scriptLinks);
                            }
                        });
                        return result;
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Setup and ScriptLinks required for the currently configured
                // fields.
                ////////////////////////////////////////////////////////////////////////////////
                injectScriptLinks: function (scriptLinks) {
                    csrConfigSetter.deleteScriptlinks(function () {
                        csrConfigSetter.addScriptlinks(scriptLinks, function () {
                            // quiet on success, alert on error
                        });
                    });
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Setup and JSLink required for the currently configured
                // fields.
                ////////////////////////////////////////////////////////////////////////////////
                injectJSLink: function (jsLink) {
                    csrConfigSetter.initClientContext(function () {
                        var fields = {};
                        $.each(Object.keys(jsLink), function (i, key) {
                            fields[key] = csrConfigSetter.web.get_availableFields().getByInternalNameOrTitle(key);
                            csrConfigSetter.clientContext.load(fields[key]);
                        });

                        $.each(csrConfigSetter.toDelete, function (i, name) {
                            fields[name] = csrConfigSetter.web.get_availableFields().getByInternalNameOrTitle(name);
                            csrConfigSetter.clientContext.load(fields[name]);
                        });

                        csrConfigSetter.clientContext.executeQueryAsync(function () {
                            $.each(Object.keys(jsLink), function (i, key) {
                                var scripts = jsLink[key].join("|");
                                fields[key].set_jsLink(scripts);
                                fields[key].updateAndPushChanges(true);
                            });

                            $.each(csrConfigSetter.toDelete, function (i, name) {
                                fields[name].set_jsLink("");
                                fields[name].updateAndPushChanges(true);
                            });

                            csrConfigSetter.clientContext.executeQueryAsync(function () {
                                // silent on success, alert on error
                            }, csrConfigSetter.error);
                        }, csrConfigSetter.error);
                    });
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Add a script link for item in the scriptLinks array. Note: lines
                // that do not begin with ~sitecollection or ~site and do not end with .js or .css will be skipped
                // intentionally.
                ////////////////////////////////////////////////////////////////////////////////
                addScriptlinks: function (scriptLinks, callback) {
                    csrConfigSetter.initClientContext(function () {
                        var count = 0;
                        var suuid = SP.Guid.newGuid();
                        for (var i = 0; i < scriptLinks.length; i++) {
                            var file = scriptLinks[i];
                            if ((/\.js$/.test(file) || /\.css$/.test(file)) && (/^~sitecollection/.test(file) || /^~site/.test(file))) {
                                count++;
                                var newAction = csrConfigSetter.userCustomActions.add();
                                newAction.set_location("ScriptLink");
                                if (/\.js$/.test(file)) {
                                    newAction.set_scriptSrc(file + "?rev=" + suuid);
                                }
                                else {
                                    var css = file.replace(/~sitecollection/g, _spPageContextInfo.siteAbsoluteUrl).replace(/~site/g, _spPageContextInfo.webAbsoluteUrl);
                                    newAction.set_scriptBlock("document.write(\"<link rel='stylesheet' type='text/css' href='" + css + "'>\");");
                                }
                                newAction.set_sequence(59000 + i);
                                newAction.set_title("CSRConfig Setter File #" + i);
                                newAction.set_description("Set programmaically by SetScriptlink.aspx.");
                                newAction.update();
                            }
                        }

                        if (count) {
                            csrConfigSetter.clientContext.executeQueryAsync(callback, csrConfigSetter.error);
                        }
                        else {
                            callback();
                        }
                    });
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Delete script links who's titles look like they were set by me.
                ////////////////////////////////////////////////////////////////////////////////
                deleteScriptlinks: function (callback) {
                    csrConfigSetter.initClientContext(function () {
                        var enumerator = csrConfigSetter.userCustomActions.getEnumerator();
                        var toDelete = [];
                        while (enumerator.moveNext()) {
                            var action = enumerator.get_current();
                            if (/^CSRConfig Setter File #/.test(action.get_title())) {
                                toDelete.push(action);
                            }
                        }

                        if (toDelete.length > 0) {
                            for (var i = 0; i < toDelete.length; i++) {
                                toDelete[i].deleteObject();
                            }

                            csrConfigSetter.clientContext.executeQueryAsync(callback, csrConfigSetter.error);
                        }
                        else {
                            callback();
                        }
                    }, csrConfigSetter.error);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the sharepoint object model, including site, web, and userCustomActions.
                ////////////////////////////////////////////////////////////////////////////////
                initClientContext: function (success, failure) {
                    if (!csrConfigSetter.clientContext) {
                        csrConfigSetter.clientContext = new SP.ClientContext();

                        if (!csrConfigSetter.site) {
                            csrConfigSetter.site = csrConfigSetter.clientContext.get_site();
                        }

                        if (!csrConfigSetter.userCustomActions) {
                            csrConfigSetter.userCustomActions = csrConfigSetter.site.get_userCustomActions();
                            csrConfigSetter.clientContext.load(csrConfigSetter.userCustomActions);
                        }

                        if (!csrConfigSetter.web) {
                            csrConfigSetter.web = csrConfigSetter.clientContext.get_web();
                        }

                        csrConfigSetter.clientContext.executeQueryAsync(success, failure);
                    }
                    else {
                        success();
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Failure callback for all async calls.
                ////////////////////////////////////////////////////////////////////////////////
                error: function () {
                    alert("Oops, something bad happened...");
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Merge two arrays removing duplicates.
                ////////////////////////////////////////////////////////////////////////////////
                merge: function (a, b) {
                    var c = $.merge(a, b);
                    return $.map(c, function (v, i) { return c.indexOf(v) === i ? v : undefined; });
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Reverse engineer a single table into JSON.
                ////////////////////////////////////////////////////////////////////////////////
                getConfig: function (id) {
                    var result = [];
                    var $table = $("#" + id);
                    $.each($table.find("tr.config"), function (i, tr) {
                        result.push($($(tr).children()[0]).text());
                    });
                    return result;
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Construct and inject a single configuration table into the DOM.
                ////////////////////////////////////////////////////////////////////////////////
                drawCSRTable: function (csrModule) {
                    var $div = $("#csrModuleTables");
                    $div.append($("<h3/>").text(csrModule.displayName + " Fields"));
                    var $table = $("<table/>", { "id": csrModule.name + "Table", "class": "csr-fields" });
                    $div.append($table);

                    var $headers = $("<tr/>");
                    $headers.append($("<th/>", { "class": "name ui-widget-header ui-corner-all nobr" }).text("Internal Name"));
                    $headers.append($("<th/>", { "class": "displayname ui-widget-header ui-corner-all nobr" }).text("DisplayName"));
                    $headers.append($("<th/>", { "class": "type ui-widget-header ui-corner-all nobr" }).text("Field Type"));
                    $headers.append($("<th/>", { "class": "delete" }));
                    $table.append($headers);

                    var config = $.csrConfig[csrModule.name + "Fields"];
                    $.each($(config), function (i, k) {
                        var v = csrConfigSetter[csrModule.name][k];
                        if (typeof (v) !== "undefined") {
                            var $row = $("<tr/>", { "class": "config" });
                            $row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.name)));
                            $row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.displayName)));
                            $row.append(($("<td/>", { "class": "ui-widget-content ui-corner-all nobr" }).html(v.type)));
                            $row.append(($("<td/>").html("<span class='ui-button-icon-primary ui-icon ui-icon-closethick'></span>")))
                            $table.append($row);
                        }
                    });
                    if ($table.find("td").length === 0) {
                        $table.append((
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
