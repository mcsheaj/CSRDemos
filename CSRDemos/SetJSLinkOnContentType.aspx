<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    Set JSLink on ContentType
<!--
 @copyright 2016 Joe McShea
 @license under the MIT license:
    http://www.opensource.org/licenses/mit-license.php
-->
</asp:Content>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitleInTitleArea' runat='server'>
    <span class='ms-WikiPageNameEditor-Display' id='listBreadCrumb'></span>
    <span class='ms-WikiPageNameEditor-Display' id='wikiPageNameDisplay'></span>
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
                <td>JSLink:</td>
                <td>
                    <input type="text" name="jslink" id="jslink" style="width: 600px;" />
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
                    jslinkSetter.ctx = new SP.ClientContext.get_current();
                    jslinkSetter.web = jslinkSetter.ctx.get_web();

                    jslinkSetter.contentTypes = jslinkSetter.web.get_availableContentTypes();
                    jslinkSetter.ctx.load(jslinkSetter.contentTypes);

                    jslinkSetter.ctx.executeQueryAsync(
                        function () {
                            jslinkSetter.enumerateContentTypes();
                            jslinkSetter.initGroupSelect();
                            jslinkSetter.initContentTypeSelect();
                            jslinkSetter.initButton();
                            document.getElementById("setJsLink").disabled = true;
                            document.getElementById("form").style.display = "block";
                        },
                        function () {
                            alert("Could not load content types.");
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

                    contentTypeSelect.onchange = function (e) {
                        e = e || event;
                        if (e.target.value.length > 0) {
                            var option = jslinkSetter.options[e.target.value];
                            document.getElementById("jslink").value = option.jslink;
                            document.getElementById("setJsLink").disabled = false;
                        }
                        else {
                            document.getElementById("jslink").value = "";
                            document.getElementById("setJsLink").disabled = true;
                        }
                    }
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
                                // no convenient getByTitle method exists for content types
                                var enumerator = jslinkSetter.contentTypes.getEnumerator();
                                while (enumerator.moveNext()) {
                                    var current = enumerator.get_current();
                                    if (name === current.get_name()) {
                                        contentType = current;
                                        break;
                                    }
                                }
                                // set jslink not supported for survey or event content types
                                contentType.set_jsLink(document.getElementById("jslink").value);
                                contentType.update(true);
                                jslinkSetter.ctx.executeQueryAsync(
                                    function () {
                                        document.getElementById("jslink").value = contentType.get_jsLink();
                                        alert("Successfully updated content type '" + name + "'.");
                                    },
                                    function () {
                                        alert("Could not update content type '" + name + "'.");
                                    }
                                );
                            },
                            function () {
                                alert("Could not load content type '" + name + "'.");
                            }
                        );
                    };
                }
            };
            var jslinkSetter = intellipoint.jslinkSetter;
        })();

        SP.SOD.executeFunc("sp.js", "SP.ClientContext", function () {
            intellipoint.jslinkSetter.init();
        });
    </script>
</asp:Content>
