<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    Set JSLink on Field
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
        <h2>Set the JSLink Property of a Site Column</h2>
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
                <td>Field:</td>
                <td>
                    <select id="fieldSelect">
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
                // of column groups and columns, and attach event handlers.
                ////////////////////////////////////////////////////////////////////////////////
                init: function () {
                    // get the context
                    jslinkSetter.ctx = new SP.ClientContext.get_current();
                    jslinkSetter.web = jslinkSetter.ctx.get_web();

                    // load the site columns
                    jslinkSetter.fields = jslinkSetter.web.get_availableFields();
                    jslinkSetter.ctx.load(jslinkSetter.fields);

                    // exec the query async
                    jslinkSetter.ctx.executeQueryAsync(
                        function () {
                            // on success enumerate the fields and initialize the form controls
                            jslinkSetter.enumerateFields();
                            jslinkSetter.initGroupSelect();
                            jslinkSetter.initFieldSelect();
                            jslinkSetter.initButton();
                            document.getElementById("setJsLink").disabled = true;
                            document.getElementById("form").style.display = "block";
                        },
                        function () {
                            alert("Could not load site columns.")
                        }
                    );
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Enumerate the site columns and store information about them to be used
                // to populate the drop-downs.
                ////////////////////////////////////////////////////////////////////////////////
                enumerateFields: function () {
                    var enumerator = jslinkSetter.fields.getEnumerator();
                    while (enumerator.moveNext()) {
                        var current = enumerator.get_current();
                        var option = {}
                        option.value = current.get_internalName();
                        option.text = current.get_internalName() + " [" + current.get_title() + "]";
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

                    // when the group changes, trim the fields select
                    groupSelect.onchange = function (e) {
                        e = e || event;
                        var fieldSelect = document.getElementById("fieldSelect");
                        var keys = Object.keys(jslinkSetter.options).sort();
                        fieldSelect.innerHTML = "<option></option>";
                        document.getElementById("jslink").value = "";
                        document.getElementById("setJsLink").disabled = true;
                        for (var i = 0; i < keys.length; i++) {
                            var o = jslinkSetter.options[keys[i]];
                            if (e.target.value.length === 0 || o.group === e.target.value) {
                                var newOption = document.createElement("option");
                                newOption.value = o.value;
                                newOption.text = o.text;
                                fieldSelect.appendChild(newOption);
                            }
                        }
                    }
                },

                ////////////////////////////////////////////////////////////////////////////////
                // Initialize the field drop-down and add an onchange listener to it.
                ////////////////////////////////////////////////////////////////////////////////
                initFieldSelect: function () {
                    var fieldSelect = document.getElementById("fieldSelect");
                    var keys = Object.keys(jslinkSetter.options).sort();
                    for (var i = 0; i < keys.length; i++) {
                        var current = jslinkSetter.options[keys[i]];
                        var o = document.createElement('option');
                        o.value = current.value;
                        o.text = current.text;
                        fieldSelect.appendChild(o);
                    }

                    // when the field changes, initialize the jslink text area and enable the button
                    fieldSelect.onchange = function (e) {
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
                // Initialize the button and add an onchange listener to it.
                ////////////////////////////////////////////////////////////////////////////////
                initButton: function () {
                    var button = document.getElementById("setJsLink");
                    button.onclick = function (e) {
                        e = e || event;
                        var name = document.getElementById("fieldSelect").value;
                        // get and load the field
                        // cannot be applied to Taxonomy fields, Related Items field, and Task 
                        // Outcome field, jsLink is read-only on those objects
                        var field = jslinkSetter.web.get_availableFields().getByInternalNameOrTitle(name);
                        jslinkSetter.ctx.load(field);
                        jslinkSetter.ctx.executeQueryAsync(
                            function () {
                                // on success, set the jslink and update
                                field.set_jsLink(document.getElementById("jslink").value.split("\n").join("|"));
                                field.updateAndPushChanges(true);
                                jslinkSetter.ctx.executeQueryAsync(
                                    function () {
                                        // on success, update the cache and display a dialog
                                        jslinkSetter.options[name].jslink = document.getElementById("jslink").value.split("\n").join("|");
                                        alert("Successfully updated site column '" + name + "'.");
                                    },
                                    function () {
                                        alert("Could not update site column '" + name + "'.");
                                    }
                                );
                            },
                            function () {
                                alert("Could not load site column '" + name + "'.");
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
