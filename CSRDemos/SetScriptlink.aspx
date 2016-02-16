<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    <SharePoint:ProjectProperty Property='Title' runat='server'>- SharePoint Easy Forms Site Settings</SharePoint:ProjectProperty>
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitleInTitleArea' runat='server'>
    <span class='ms-WikiPageNameEditor-Display' id='listBreadCrumb'></span>
    <span class='ms-WikiPageNameEditor-Display' id='wikiPageNameDisplay'></span>
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
    <div class="scriptLinksdiv">
        Script files to load:
        <div>
            <textarea
                title="Enter paths to additional JavaScript and/or CSS files to load. JavaScript files must be stored in this site collection and the path must begin with ~sitecollection. All file names must end with .js or .css."
                id='scriptLinks' rows='10' cols='100'></textarea>
        </div>
    </div>
    <div class="buttun-div">
        <button id="saveButton"  type="button" class="settings-button">Save</button>
    </div>
    <script type="text/javascript">
        (function () {
            if (!window.intellipoint)
                window.intellipoint = {};

            intellipoint.scriplinkSetter = {
                scriptlinks: [],

                init: function () {
                    scriplinkSetter.getScriptlinks(function (links) {
                        if (links) {
                            var linksText = "";
                            for (var i = 0; i < links.length; i++) {
                                linksText += links[i] + "\n";
                            }
                            document.getElementById("scriptLinks").value = linksText;
                        }
                    });

                    var button = document.getElementById("saveButton");
                    button.onclick = function (e) {
                        e = e || window.event;
                        scriplinkSetter.deleteScriptlinks(function () {
                            var scriptlinks = document.getElementById("scriptLinks").value.trim();
                            if (scriptlinks.length > 0) {
                                var files = scriptlinks.split("\n");
                                for (var i = 0; i < files.length; i++) {
                                    var file = files[i];
                                    if (file.trim().length > 0) {
                                        file = file.trim();
                                        if (/\.js$/.test(file)) {
                                            intellipoint.scriplinkSetter.scriptlinks.push(file);
                                        }
                                    }
                                }
                            }

                            scriplinkSetter.addScriptlinks(function () {
                                alert("Scriptlinks successfully saved.");
                            });
                        });
                    };
                },

                addScriptlinks: function (callback) {
                    var found = false;
                    var suuid = Math.uuidFast("_");
                    for (var i = 0; i < intellipoint.scriplinkSetter.scriptlinks.length; i++) {
                        var file = intellipoint.scriplinkSetter.scriptlinks[i];
                        if (/\.js$/.test(file) && /^~sitecollection/.test(file)) {
                            found = true;
                            var newAction = scriplinkSetter.userCustomActions.add();
                            newAction.set_location("ScriptLink");
                            newAction.set_scriptSrc(file + "?rev=" + suuid);
                            newAction.set_sequence(59000 + i);
                            newAction.set_title("Scriptlink Setter File #" + i);
                            newAction.set_description("Generally used to load SPEasyForms AddOns.");
                            newAction.update();
                        }
                    }

                    if (found) {
                        scriplinkSetter.clientContext.executeQueryAsync(callback, scriplinkSetter.error);
                    }
                    else {
                        callback();
                    }
                },

                deleteScriptlinks: function (callback) {
                    scriplinkSetter.initClientContext(function () {
                        var enumerator = scriplinkSetter.userCustomActions.getEnumerator();
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

                            scriplinkSetter.clientContext.executeQueryAsync(callback, scriplinkSetter.error);
                        }
                        else {
                            callback();
                        }
                    }, scriplinkSetter.error);
                },

                getScriptlinks: function (callback) {
                    scriplinkSetter.initClientContext(function () {
                        var enumerator = scriplinkSetter.userCustomActions.getEnumerator();
                        var result = [];
                        while (enumerator.moveNext()) {
                            var action = enumerator.get_current();
                            if (/^Scriptlink Setter File #/.test(action.get_title())) {
                                var path = action.get_scriptSrc();
                                if (path.indexOf("?") > 0)
                                    path = path.substr(0, path.indexOf("?"));
                                result.push(path);
                            }
                        }
                        callback(result);
                    }, scriplinkSetter.error);
                },

                initClientContext: function (success, failure) {
                    if (!scriplinkSetter.clientContext) {
                        scriplinkSetter.clientContext = new SP.ClientContext();
                    }

                    if (!scriplinkSetter.site) {
                        scriplinkSetter.site = scriplinkSetter.clientContext.get_site();
                    }

                    if (!scriplinkSetter.userCustomActions) {
                        scriplinkSetter.userCustomActions = scriplinkSetter.site.get_userCustomActions();
                        scriplinkSetter.clientContext.load(scriplinkSetter.userCustomActions);
                    }

                    scriplinkSetter.clientContext.executeQueryAsync(success, failure);
                },

                error: function() {
                    alert("oops...");
                }
            };

            var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
            Math.uuidFast = function (separator) {
                var chars = CHARS, uuid = new Array(36), rnd = 0, r;
                separator = separator || '-';
                for (var i = 0; i < 36; i++) {
                    if (i == 8 || i == 13 || i == 18 || i == 23) {
                        uuid[i] = separator;
                    } else if (i == 14) {
                        uuid[i] = '4';
                    } else {
                        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                        r = rnd & 0xf;
                        rnd = rnd >> 4;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
                return uuid.join('');
            };

            var scriplinkSetter = intellipoint.scriplinkSetter;
        })();

        SP.SOD.executeFunc("sp.js", "SP.ClientContext", function () {
            intellipoint.scriplinkSetter.init();
        });
    </script>
</asp:Content>
