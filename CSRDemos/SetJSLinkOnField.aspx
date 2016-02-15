<!--
 @copyright 2016 Joe McShea
 @license under the MIT license:
    http://www.opensource.org/licenses/mit-license.php
-->
<%@ Assembly Name="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Page Language="C#" Inherits="Microsoft.SharePoint.WebPartPages.WikiEditPage" MasterPageFile="~masterurl/default.master" %>

<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=14.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Import Namespace="Microsoft.SharePoint" %>
<asp:Content ContentPlaceHolderID='PlaceHolderPageTitle' runat='server'>
    Set JSLink on Field
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

            window.jmm = {};

            jmm.jslinkSetter = {
                groups: [],
                options: {},
                init: function () {
                    jslinkSetter.ctx = new SP.ClientContext.get_current();
                    jslinkSetter.web = jslinkSetter.ctx.get_web();

                    jslinkSetter.fields = jslinkSetter.web.get_availableFields();
                    jslinkSetter.ctx.load(jslinkSetter.fields);

                    jslinkSetter.ctx.executeQueryAsync(
                        function () {
                            jslinkSetter.enumerateFields();
                            jslinkSetter.initGroupSelect();
                            jslinkSetter.initFieldSelect();
                            jslinkSetter.initButton();
                            document.getElementById("form").style.display = "block";
                        },
                        function () {
                            alert("Could not load site columns.")
                        }
                    );
                },

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
                        var fieldSelect = document.getElementById("fieldSelect");
                        var keys = Object.keys(jslinkSetter.options).sort();
                        fieldSelect.innerHTML = "<option></option>";
                        document.getElementById("jslink").value = "";
                        for (var i = 0; i < keys.length; i++) {
                            var o = jslinkSetter.options[keys[i]];
                            if (o.group === e.target.value) {
                                var newOption = document.createElement("option");
                                newOption.value = o.value;
                                newOption.text = o.text;
                                fieldSelect.appendChild(newOption);
                            }
                        }
                    }
                },

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

                    fieldSelect.onchange = function (e) {
                        e = e || event;
                        var option = jslinkSetter.options[e.target.value];
                        document.getElementById("jslink").value = option.jslink;
                    }
                },

                initButton: function () {
                    var button = document.getElementById("setJsLink");
                    button.onclick = function (e) {
                        e = e || event;
                        var name = document.getElementById("fieldSelect").value;
                        // cannot be applied to Taxonomy fields, Related Items field, and Task Outcome field, jsLink is read-only on those objects
                        var field = jslinkSetter.web.get_availableFields().getByTitle(name);
                        jslinkSetter.ctx.load(field);
                        jslinkSetter.ctx.executeQueryAsync(
                            function () {
                                field.set_jsLink(document.getElementById("jslink").value);
                                field.updateAndPushChanges(true);
                                jslinkSetter.ctx.executeQueryAsync(
                                    function () {
                                        document.getElementById("jslink").value = field.get_jsLink();
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
            var jslinkSetter = jmm.jslinkSetter;
        })();

        SP.SOD.executeFunc("sp.js", "SP.ClientContext", function () {
            jmm.jslinkSetter.init();
        });
    </script>
</asp:Content>
