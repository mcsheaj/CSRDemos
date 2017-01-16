<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    Set JSLink on ContentType
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitleInTitleArea' runat='server'>
<!--
 @copyright 2016-2017 Joe McShea
 @license under the MIT license:
    http://www.opensource.org/licenses/mit-license.php
-->
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderAdditionalPageHead' runat='server'>

    <meta name='CollaborationServer' content='SharePoint Team Web Site' />
    <style type="text/css">
        #pageStatusBar {
            display: none !important;
        }

        h2 {
            margin-bottom: 20px;
        }

        button {
            margin-top: 20px;
        }

        #form {
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
    <div id="form">
        <h2>Set the JSLink Property of a Content Type</h2>
        <table cellpadding="5">
            <tr>
                <td>Group:</td>
                <td>
                    <select id="groupSelect">
                        <option></option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>Content Type:</td>
                <td>
                    <select id="contentTypeSelect">
                        <option></option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>List:</td>
                <td>
                    <select id="listSelect">
                        <option></option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>JSLink:</td>
                <td>
                    <textarea
                        title="Enter paths to JavaScript files to load for this field. JavaScript files must be stored in this site collection and the path must begin with ~sitecollection."
                        id='jslink' rows='10' cols='100'></textarea>
                </td>
            </tr>
        </table>
        <button type="button" id="setJsLink">Set JSLink</button>
    </div>
    <script type="text/javascript">
        (function () {
            Array.prototype.contains = function (obj) {
                var i = this.length;
                while (i--) {
                    if (this[i] === obj) {
                        return true;
                    }
                }
                return false;
            }

            if (!window.intellipoint)
                window.intellipoint = {};

            ////////////////////////////////////////////////////////////////////////////////
            // Form code behind class
            ////////////////////////////////////////////////////////////////////////////////
            intellipoint.jslinkSetter = {
                groups: [],
                options: {},

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the SharePoint object model context, populate the drop-down
                // of content type groups and content types, and attach event handlers.
                ////////////////////////////////////////////////////////////////////////////////
                init: function () {
                    // get the context
                    jslinkSetter.ctx = new SP.ClientContext.get_current();
                    jslinkSetter.web = jslinkSetter.ctx.get_web();

                    // load available content types
                    jslinkSetter.contentTypes = jslinkSetter.web.get_availableContentTypes();
                    jslinkSetter.ctx.load(jslinkSetter.contentTypes);

                    // exec the query async
                    jslinkSetter.ctx.executeQueryAsync(
                        function () {
                            // on success, enumerate the content types and initialize the form controls
                            jslinkSetter.enumerateContentTypes();
                            jslinkSetter.initGroupSelect();
                            jslinkSetter.initContentTypeSelect();
                            jslinkSetter.initListSelect();
                            jslinkSetter.initButton();
                            document.getElementById("setJsLink").disabled = true;
                            document.getElementById("form").style.display = "block";
                        },
                        function (sender, args) {
                            jslinkSetter.error("Could not load content types.", args);
                        }
                    );
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Enumerate the content types and store information about them to be used
                // to populate the drop-downs.
                ////////////////////////////////////////////////////////////////////////////////
                enumerateContentTypes: function () {
                    var enumerator = jslinkSetter.contentTypes.getEnumerator();
                    while (enumerator.moveNext()) {
                        var current = enumerator.get_current();
                        var option = {}
                        option.value = current.get_name();
                        option.text = option.value;
                        option.group = current.get_group();
                        option.jslink = current.get_jsLink();
                        option.id = current.get_id().toString();
                        if (!jslinkSetter.groups.contains(option.group)) {
                            jslinkSetter.groups.push(option.group);
                        }
                        jslinkSetter.options[option.value] = option;
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the group drop-down and add an onchange listener to it.
                ////////////////////////////////////////////////////////////////////////////////
                initGroupSelect: function () {
                    var groupSelect = document.getElementById("groupSelect");
                    jslinkSetter.groups = jslinkSetter.groups.sort();
                    for (var i = 0; i < jslinkSetter.groups.length; i++) {
                        var current = jslinkSetter.groups[i];
                        var o = document.createElement('option');
                        o.value = current;
                        o.text = current;
                        groupSelect.appendChild(o);
                    }

                    // when the group changes, trim the content type select
                    groupSelect.onchange = function (e) {
                        e = e || event;
                        var contentTypeSelect = document.getElementById("contentTypeSelect");
                        var keys = Object.keys(jslinkSetter.options).sort();
                        contentTypeSelect.innerHTML = "<option></option>";
                        document.getElementById("jslink").value = "";
                        document.getElementById("setJsLink").disabled = true;
                        for (var i = 0; i < keys.length; i++) {
                            var o = jslinkSetter.options[keys[i]];
                            if (e.target.value.length == 0 || o.group === e.target.value) {
                                var newOption = document.createElement("option");
                                newOption.value = o.value;
                                newOption.text = o.text;
                                contentTypeSelect.appendChild(newOption);
                            }
                        }
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the content type drop-down and add an onchange listener to it.
                ////////////////////////////////////////////////////////////////////////////////
                initContentTypeSelect: function () {
                    var contentTypeSelect = document.getElementById("contentTypeSelect");
                    var keys = Object.keys(jslinkSetter.options).sort();
                    for (var i = 0; i < keys.length; i++) {
                        var current = jslinkSetter.options[keys[i]];
                        var o = document.createElement('option');
                        o.value = current.value;
                        o.text = current.text;
                        contentTypeSelect.appendChild(o);
                    }

                    // when the content type changes, initialize the jslink text area
                    contentTypeSelect.onchange = function (e) {
                        e = e || event;
                        if (e.target.value.length > 0) {
                            var option = jslinkSetter.options[e.target.value];
                            document.getElementById("jslink").value = option.jslink.split("|").join("\n");
                            document.getElementById("setJsLink").disabled = false;
                        }
                        else {
                            document.getElementById("jslink").value = "";
                            document.getElementById("setJsLink").disabled = true;
                        }
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the list drop-down.
                ////////////////////////////////////////////////////////////////////////////////
                initListSelect: function () {
                    var lists = jslinkSetter.web.get_lists();
                    jslinkSetter.ctx.load(lists);
                    jslinkSetter.ctx.executeQueryAsync(
                        function () {
                            var listSelect = document.getElementById("listSelect");
                            var enumerator = lists.getEnumerator();
                            while (enumerator.moveNext()) {
                                var current = enumerator.get_current();
                                var o = document.createElement("option");
                                o.value = current.get_title();
                                o.text = current.get_title();
                                listSelect.appendChild(o);
                            }
                        },
                        function (sender, args) {
                            jslinkSetter.error("Could not load lists.", args);
                        }
                    );
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the button and add an onchange listener to it.
                ////////////////////////////////////////////////////////////////////////////////
                initButton: function () {
                    var button = document.getElementById("setJsLink");
                    button.onclick = function (e) {
                        e = e || event;
                        var name = document.getElementById("contentTypeSelect").value;
                        var contentTypes = jslinkSetter.web.get_availableContentTypes();
                        jslinkSetter.ctx.load(contentTypes);
                        var contentType;
                        jslinkSetter.ctx.executeQueryAsync(
                            function () {
                                // no convenient getByTitle method exists for content types, find the hard way
                                var enumerator = jslinkSetter.contentTypes.getEnumerator();
                                while (enumerator.moveNext()) {
                                    var current = enumerator.get_current();
                                    if (name === current.get_name()) {
                                        contentType = current;
                                        break;
                                    }
                                }
                                // set jslink and update, note: true or false, not all changes are pushed down
                                // set jslink not supported for survey or event content types
                                contentType.set_jsLink(document.getElementById("jslink").value.split("\n").join("|"));
                                contentType.update(true);
                                jslinkSetter.ctx.executeQueryAsync(
                                    function () {
                                        // on success, update the cache and display a dialog
                                        jslinkSetter.options[name].jslink = document.getElementById("jslink").value.split("\n").join("|");
                                        var listSelect = document.getElementById("listSelect");
                                        if (listSelect.options[listSelect.selectedIndex].value.length > 0) {
                                            jslinkSetter.doItAgainOnTheListContentType(name);
                                        }
                                        else {
                                            alert("Successfully updated content type '" + name + "'.");
                                        }
                                    },
                                    function (sender, args) {
                                        jslinkSetter.error("Could not update content type '" + name + "'.", args);
                                    }
                                );
                            },
                            function (sender, args) {
                                jslinkSetter.error("Could not load content type '" + name + "'.", args);
                            }
                        );
                    };
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Update the content type jslink on the list selected.
                ////////////////////////////////////////////////////////////////////////////////
                doItAgainOnTheListContentType: function (name) {
                    var listSelect = document.getElementById("listSelect");
                    var currentList = listSelect.options[listSelect.selectedIndex].value;
                    var list = jslinkSetter.web.get_lists().getByTitle(currentList);
                    var contentTypes = list.get_contentTypes();
                    jslinkSetter.ctx.load(contentTypes);
                    jslinkSetter.ctx.executeQueryAsync(
                        function () {
                            // no convenient getByTitle method exists for content types, find the hard way
                            var contentType;
                            var enumerator = contentTypes.getEnumerator();
                            while (enumerator.moveNext()) {
                                var current = enumerator.get_current();
                                if (name === current.get_name()) {
                                    contentType = current;
                                    break;
                                }
                            }
                            // set jslink and update, note: update(true) will fail with the message X has no children, must do update(false);
                            if (contentType) {
                                contentType.set_jsLink(document.getElementById("jslink").value.split("\n").join("|"));
                                contentType.update(); // passing in true results in an error
                                jslinkSetter.ctx.executeQueryAsync(
                                    function () {
                                        alert("Successfully updated content type '" + name + "'.");
                                    },
                                    function (sender, args) {
                                        jslinkSetter.error("Failed to update content type '" + name + "' on list '" + currentList + "'.", args);
                                    }
                                );
                            }
                        },
                        function (sender, args) {
                            jslinkSetter.error("Could not load content types from list '" + currentList + "'.", args);
                        }
                    );
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Alert with useful information on an asynchronous callback error from SharePoint.
                ////////////////////////////////////////////////////////////////////////////////
                error: function (message, args) {
                    alert(message + "\n\n" + args.get_errorTypeName() + ": " + args.get_message() + " (CorrelationId: " + args.get_errorTraceCorrelationId() + ")");
                }
            };

            var jslinkSetter = intellipoint.jslinkSetter;
        })();

        SP.SOD.executeFunc("sp.js", "SP.ClientContext", function () {
            intellipoint.jslinkSetter.init();
        });
    </script>
</asp:Content>

