<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    Scriptlink Settings
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitleInTitleArea' runat='server'>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderAdditionalPageHead' runat='server'>
    <meta name='CollaborationServer' content='SharePoint Team Web Site' />
    <style type="text/css">
        .settingsheader {
            font-family: "SegoeUI-SemiLight-final","Segoe UI SemiLight","Segoe UI WPC Semilight","Segoe UI",Segoe,Tahoma,Helvetica,Arial,sans-serif;
            font-size: 1.8em;
            color: darkslategray;
            margin-bottom: 20px;
        }

        .ms-status-yellow {
            display: none !important;
        }

        .scriptLinksdiv {
            margin-top: 20px;
            margin-bottom: 30px;
        }

        label {
            display: inline-block;
            width: 5em;
        }

        .buttun-div {
            text-align: right;
            width: 700px;
        }

        button.settings-button {
            font-size: 1em;
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
    <div class='settingsheader'>Scriptlinks</div>
    <div>
        Scope: 
            <select id="scope">
                <option value="site">Site Collection</option>
                <option value="web">Site</option>
            </select>
    </div>
    <div class="scriptLinksdiv">
        Script files to load:
        <div>
            <textarea
                title="Enter paths to additional JavaScript and/or CSS files to load. JavaScript files must be stored in this site collection and the path must begin with ~sitecollection. All file names must end with .js or .css."
                id='scriptLinks' rows='10' cols='100'></textarea>
        </div>
    </div>
    <div class="buttun-div">
        <button id="saveButton" type="button" class="settings-button">Save</button>
    </div>
    <script type="text/javascript">
        (function () {
            if (!window.intellipoint)
                window.intellipoint = {};

            ////////////////////////////////////////////////////////////////////////////////
            // Form code behind class
            ////////////////////////////////////////////////////////////////////////////////
            intellipoint.scriptlinkSetter = {
                scriptlinks: [],

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the SharePoint object model context, and populate the script link
                // text area with the current script links.
                ////////////////////////////////////////////////////////////////////////////////
                init: function () {
                    scriptlinkSetter.getScriptlinks(scriptlinkSetter.arrayToTextArea);

                    // on scope change, modify and scriptlinkSetter.userCustomActions to point to 
                    // the web or site as selected, and reinitialize the script link text area
                    document.getElementById("scope").onchange = function (e) {
                        var scope = document.getElementById("scope").value;
                        if (scope === "web") {
                            scriptlinkSetter.userCustomActions = scriptlinkSetter.webUserCustomActions;
                            scriptlinkSetter.getScriptlinks(scriptlinkSetter.arrayToTextArea);
                        }
                        else {
                            scriptlinkSetter.userCustomActions = scriptlinkSetter.siteUserCustomActions;
                            scriptlinkSetter.getScriptlinks(scriptlinkSetter.arrayToTextArea);
                        }
                    };

                    var button = document.getElementById("saveButton");
                    // on click, set the script links; note: all existing script links are deleted 
                    // and new ones are added from scratch, in the order they're listed
                    button.onclick = function (e) {
                        e = e || window.event;
                        scriptlinkSetter.deleteScriptlinks(function () {
                            var value = document.getElementById("scriptLinks").value.trim();
                            if (value.length > 0) {
                                var files = value.split("\n");
                                for (var i = 0; i < files.length; i++) {
                                    var file = files[i];
                                    if (file.trim().length > 0) {
                                        file = file.trim();
                                        if (/\.js$/.test(file) || /\.css$/.test(file)) {
                                            scriptlinkSetter.scriptlinks.push(file);
                                        }
                                    }
                                }
                            }

                            scriptlinkSetter.addScriptlinks(function () {
                                alert("Scriptlinks successfully saved.");
                            });
                        });
                    };
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Add a script link for each line on the script link text area. Note: lines
                // that do not begin with ~sitecollection or ~site and do not end with .js or .css will be skipped
                // intentionally.
                ////////////////////////////////////////////////////////////////////////////////
                addScriptlinks: function (callback) {
                    var count = 0;
                    var suuid = SP.Guid.newGuid();
                    for (var i = 0; i < scriptlinkSetter.scriptlinks.length; i++) {
                        var file = scriptlinkSetter.scriptlinks[i];
                        if ((/\.js$/.test(file) || /\.css$/.test(file)) && (/^~sitecollection/.test(file) || /^~site/.test(file))) {
                            count++;
                            var newAction = scriptlinkSetter.userCustomActions.add();
                            newAction.set_location("ScriptLink");
                            if (/\.js$/.test(file)) {
                                newAction.set_scriptSrc(file + "?rev=" + suuid);
                            }
                            else {
                                var css = file.replace(/~sitecollection/g, _spPageContextInfo.siteAbsoluteUrl).replace(/~site/g, _spPageContextInfo.webAbsoluteUrl);
                                newAction.set_scriptBlock("document.write(\"<link rel='stylesheet' type='text/css' href='" + css + "'>\");");
                            }
                            newAction.set_sequence(59000 + i);
                            newAction.set_title("Scriptlink Setter File #" + i);
                            newAction.set_description("Set programmaically by SetScriptlink.aspx.");
                            newAction.update();
                        }
                    }

                    if (count) {
                        scriptlinkSetter.clientContext.executeQueryAsync(callback, scriptlinkSetter.error);
                    }
                    else {
                        callback();
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Delete script links who's titles look like they were set by me.
                ////////////////////////////////////////////////////////////////////////////////
                deleteScriptlinks: function (callback) {
                    scriptlinkSetter.initClientContext(function () {
                        var enumerator = scriptlinkSetter.userCustomActions.getEnumerator();
                        var toDelete = [];
                        while (enumerator.moveNext()) {
                            var action = enumerator.get_current();
                            if (/^Scriptlink Setter File #/.test(action.get_title())) {
                                toDelete.push(action);
                            }
                        }

                        if (toDelete.length > 0) {
                            for (var i = 0; i < toDelete.length; i++) {
                                toDelete[i].deleteObject();
                            }

                            scriptlinkSetter.clientContext.executeQueryAsync(callback, scriptlinkSetter.error);
                        }
                        else {
                            callback();
                        }
                    }, scriptlinkSetter.error);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Get script links who's titles look like they were set by me.
                ////////////////////////////////////////////////////////////////////////////////
                getScriptlinks: function (callback) {
                    scriptlinkSetter.initClientContext(function () {
                        var enumerator = scriptlinkSetter.userCustomActions.getEnumerator();
                        var tmp = [], result = [];
                        while (enumerator.moveNext()) {
                            var action = enumerator.get_current();
                            if (/^Scriptlink Setter File #/.test(action.get_title())) {
                                var path = action.get_scriptSrc();
                                if (path) {
                                    if (path.indexOf("?") > 0)
                                        path = path.substr(0, path.indexOf("?"));
                                    tmp.push({ p: path, s: action.get_sequence() });
                                }
                                else {
                                    var scriptBlock = action.get_scriptBlock();
                                    var regexp = new RegExp("href=\'([^\']*)\'", "i");
                                    var matches = scriptBlock.match(regexp);
                                    if(matches && matches.length >= 2) {
                                        path = matches[1];
                                        var sitecollectionregexp = new RegExp(_spPageContextInfo.siteAbsoluteUrl, "g");
                                        var siteregexp = new RegExp(_spPageContextInfo.webAbsoluteUrl, "g");
                                        path = path.replace(sitecollectionregexp, "~sitecollection").replace(siteregexp, "~site");
                                        tmp.push({ p: path, s: action.get_sequence() });
                                    }
                                }
                            }
                        }
                        tmp = tmp.sort(function (a, b) { if (a.s < b.s) return -1; if (a.s > b.s) return 1; return 0 });
                        for (var i = 0; i < tmp.length; i++) {
                            result.push(tmp[i].p);
                        }
                        callback(result);
                    }, scriptlinkSetter.error);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the sharepoint object model, including site, web, and userCustomActions.
                ////////////////////////////////////////////////////////////////////////////////
                initClientContext: function (success, failure) {
                    if (!scriptlinkSetter.clientContext) {
                        scriptlinkSetter.clientContext = new SP.ClientContext();
                    }

                    if (!scriptlinkSetter.site) {
                        scriptlinkSetter.site = scriptlinkSetter.clientContext.get_site();
                    }

                    if (!scriptlinkSetter.siteUserCustomActions) {
                        scriptlinkSetter.siteUserCustomActions = scriptlinkSetter.site.get_userCustomActions();
                        scriptlinkSetter.clientContext.load(scriptlinkSetter.siteUserCustomActions);
                        scriptlinkSetter.userCustomActions = scriptlinkSetter.siteUserCustomActions;
                    }

                    if (!scriptlinkSetter.web) {
                        scriptlinkSetter.web = scriptlinkSetter.clientContext.get_web();
                    }

                    if (!scriptlinkSetter.webUserCustomActions) {
                        scriptlinkSetter.webUserCustomActions = scriptlinkSetter.web.get_userCustomActions();
                        scriptlinkSetter.clientContext.load(scriptlinkSetter.webUserCustomActions);
                    }

                    scriptlinkSetter.clientContext.executeQueryAsync(success, failure);
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Failure callback for all async calls.
                ////////////////////////////////////////////////////////////////////////////////
                error: function () {
                    alert("Oops, something bad happened...");
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Utility method to convert an array of links into text area input.
                ////////////////////////////////////////////////////////////////////////////////
                arrayToTextArea: function (lines) {
                    if (lines) {
                        var text = "";
                        for (var i = 0; i < lines.length; i++) {
                            text += lines[i] + "\n";
                        }
                        document.getElementById("scriptLinks").value = text;
                    }
                }
            };

            var scriptlinkSetter = intellipoint.scriptlinkSetter;
        })();

        SP.SOD.executeFunc("sp.js", "SP.ClientContext", function () {
            intellipoint.scriptlinkSetter.init();
        });
    </script>
</asp:Content>
