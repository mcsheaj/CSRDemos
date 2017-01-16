/*
 *  @copyright 2016-2017 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    // test is form with client side rendering
    if (typeof (SPClientTemplates) === 'undefined')
        return;
 
    if (typeof ($.csrConfig) !== 'object')
    {
        $.csrConfig = {
            entityEditorFields: [
                'BusinessUnit',
                'Skills'
            ],
        };
    }

    // wish jQuery inArray had an ignore case option ;)
    $.inArrayIgnoreCase = function(value, array) {
        value = value.toLowerCase();
        array = array.map(function (v) { return v.toLowerCase(); });
        return $.inArray(value, array);
    };

    var formWebPartId;

    /*
     * Implementation class for the overrides.
     */
    $.entityEditorImpl = {
        source: {},
        schema: {},

        /*
         * Implementation for the display form and views.
         */
        displayMethod: function (ctx) {
            $.entityEditorImpl.getCss(ctx);

            // save some stuff from the schema we're going to need later
            $.entityEditorImpl.source[ctx.CurrentFieldSchema.Name] = ctx.CurrentFieldSchema.MultiChoices;
            $.entityEditorImpl.schema[ctx.CurrentFieldSchema.Name] = ctx.CurrentFieldSchema;

            // construct the outer html for our control
            var result = $.entityEditorImpl.constructOuterContainer(ctx, false);

            // initialize the editor with current values
            $.entityEditorImpl.constructInitialEntities(ctx, result, false);

            return result.html();
        },

        /*
         * Implementation for the new and edit forms.
         */
        inputMethod: function (ctx) {
            $.entityEditorImpl.getCss(ctx);

            // save some stuff from the schema we're going to need later
            $.entityEditorImpl.source[ctx.CurrentFieldSchema.Name] = ctx.CurrentFieldSchema.MultiChoices;
            $.entityEditorImpl.schema[ctx.CurrentFieldSchema.Name] = ctx.CurrentFieldSchema;

            // construct the outer html for our control
            var result = $.entityEditorImpl.constructOuterContainer(ctx, true);
            var entityEditor = result.find(".csrdemos-entityeditor");

            // initialize the editor with current values
            $.entityEditorImpl.constructInitialEntities(ctx, entityEditor, true);

            // add the text input to the entitiy edity div
            $.entityEditorImpl.constructInput(ctx, entityEditor);

            // add a deferred event handler for the remove entity anchor
            $(".ms-formtable").on("click", ".csrdemos-remove", function (e) {
                e.stopImmediatePropagation();
                var fieldName = $(this).attr("data-fieldname");
                var entityEditorInput = $(this).closest(".csrdemos-entityeditor").find("input.csrdemos-entityeditorinput");
                $(this).parent().remove();
                $.entityEditorImpl.source[fieldName].push($(this).attr("data-value"));
                entityEditorInput.show();
                entityEditorInput.autocomplete("option", "source", $.entityEditorImpl.source[fieldName].sort()).focus();
                return false;
            });

            // register a callback to return the current value
            var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);
            current.registerGetValueCallback(current.fieldName, function () {
                return $.entityEditorImpl.getFieldValue(current);
            });

            // register validators for this control
            $.entityEditorImpl.registerValidators(current);

            return result.html();
        },

        /*
         * Setup validation for the input form.
         */
        registerValidators: function (current) {
            // create a validator set
            var fieldValidators = new SPClientForms.ClientValidation.ValidatorSet();

            // create a custom validator with an object literal insead of new and a constructor
            fieldValidators.RegisterValidator({
                Validate: function (value) {
                    var isError = false;
                    var errorMessage = '';

                    if (current.fieldSchema.FillInChoice === false) {
                        var entityInput = $('#' + current.fieldSchema.Name + 'EntityEditor').find("input.csrdemos-entityeditorinput");
                        if (entityInput.val().length > 0) {
                            isError = true;
                            errorMessage = "'" + entityInput.val() + "' is not resolved; Fill in choices are not support, so all entities must be resolved.";
                        }
                    }

                    return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
                }
            });

            // if required, add a required field validator
            if (current.fieldSchema.Required) {
                fieldValidators.RegisterValidator(new SPClientForms.ClientValidation.RequiredValidator());
            }

            // register a callback method for the validators
            current.registerValidationErrorCallback(current.fieldName, function (error) {
                $('#' + current.fieldName + 'EntityEditorError').attr('role', 'alert').html(error.errorMessage);
            });

            // register the validators
            current.registerClientValidator(current.fieldName, fieldValidators);
        },

        /*
         * Return the current value from the data-value attribute of my div.
         */
        getFieldValue: function (current) {
            var result = [];

            var entityEditorDiv = $('#' + current.fieldName + 'EntityEditor');
            var entityEditorInput = entityEditorDiv.find(".csrdemos-entityeditorinput");

            // if there is an unresolved value in the input, see if it matches a valid choice (case insensative)
            if (entityEditorInput.val().length > 0) {
                var index = $.inArrayIgnoreCase(entityEditorInput.val(), $.entityEditorImpl.source[current.fieldName]);
                if (index > -1) {
                    // if we found a valid choice, add it as an entity, clear the input, and clear the validation error if any
                    $.entityEditorImpl.selectEntity(current.fieldName, $.entityEditorImpl.source[current.fieldName][index], entityEditorInput);
                    $('#' + current.fieldName + 'EntityEditorError').attr('role', '').html("");
                }
            }

            // if there is still an unresolved value in input, and fill in choices are allowed, add whatever
            // is in input as an entity
            if ($.entityEditorImpl.schema[current.fieldName].FillInChoice === true) {
                if (entityEditorInput.val().length > 0) {
                    $.entityEditorImpl.selectEntity(current.fieldName, entityEditorInput.val(), entityEditorInput);
                    $('#' + current.fieldName + 'EntityEditorError').attr('role', '').html("");
                }
            }

            // now scoop up all of the entities (all the span.csrdemos-entity elements)
            entityEditorDiv.find('.csrdemos-entity').each(function () {
                result.push($(this).find("a").attr("data-value"));
            });

            // if this is a multi-choice field, join the array and format as a multi-choice value
            if ($.entityEditorImpl.schema[current.fieldName].FieldType === "MultiChoice") {
                if (result.length === 0) {
                    result = '';
                }
                else {
                    result = ';#' + result.join(';#') + ';#';
                }
            }
            // otherwise it's a single choice, we don't have to worry about finding multiple entities because the
            // input gets hidden for single choice any time we have an entity
            else {
                result = result.length === 1 ? result[0] : '';
            }

            return result;
        },

        /*
         * Shove a link to the stylesheet into the DOM one time.
         */
        getCss: function (ctx) {
            if (!formWebPartId) {
                formWebPartId = "WebPart" + ctx.FormUniqueId;
                var css = (function () {/*
                    <style type='text/css'>
                        .csrdemos-entityeditor {
                            border: 1px solid #ababab;
                            width: 390px;
                            padding: 3px;
                            background: white;
                        }

                        .csrdemos-entityeditor:hover {
                            border: 1px solid #92c0e0;
                        }

                        .csrdemos-entityeditor:focus {
                            border: 1px solid #2a8dd4;
                        }

                        input.csrdemos-entityeditorinput {
                            width: 200px;
                            position: relative;
                            float: left;
                            border: none;
                        }

                        .csrdemos-entity {
                            display: block;
                            padding: 2px 3px 1px 5px;
                            margin-right: 2px;
                            margin-bottom: 1px;
                            position: relative;
                            float: left;
                            background-color: #eee;
                            border: 1px solid #333;
                            -moz-border-radius: 7px;
                            -webkit-border-radius: 7px;
                            border-radius: 7px;
                            color: #333;
                            font: n ormal 11px Verdana, Sans-serif;
                        }

                        .csrdemos-entitydelete {
                            position: absolute;
                            right: 8px;
                            top: 2px;
                            color: #666;
                            font: bold 12px Verdana, Sans-serif;
                            text-decoration: none;
                        }

                        .csrdemos-remove {
                            margin-left: 5px;
                            color: #0072c6;
                        }
                    </style>
                 */}).toString().slice(15, -3);
                $("body").prepend(css);
            }
        },

        /*
         * Select an entity from the autocomplete list.
         */
        selectEntity: function (fieldName, value, entityEditorInput) {
            var $span = $("<span>", {
                "class": "csrdemos-entity",
                "title": value,
                "data-fieldname": fieldName
            }).text(value);
            $("<a>", {
                "class": "csrdemos-remove",
                "href": "#",
                "title": "Remove Entity",
                "data-fieldname": fieldName,
                "data-value": value
            }).text("x").appendTo($span);
            $span.insertBefore(entityEditorInput);

            $.entityEditorImpl.source[fieldName].splice(
                $.inArray(value, $.entityEditorImpl.source[fieldName]), 1);

            var $input = $(entityEditorInput);
            $input.autocomplete(
                "option", "source", $.entityEditorImpl.source[fieldName].sort());
            $input.val("");
            if ($.entityEditorImpl.schema[fieldName].FieldType !== "MultiChoice") {
                $input.hide();
            }

            return false;
        },

        /*
         * Construct the outer div for the entity editor.
         */
        constructOuterContainer: function (ctx, isEditable) {
            var result = $('<p/>');
            var entityEditor = $('<div/>', {
                'id': ctx.CurrentFieldSchema.Name + 'EntityEditor',
                'class': (isEditable ? 'ui-helper-clearfix csrdemos-entityeditor' : 'ui-helper-clearfix'),
                'data-fieldname': ctx.CurrentFieldSchema.Name
            });
            result.append(entityEditor);
            return result;
        },

        /*
         * Add a span for each entity in ctx.CurrentFieldValue.
         */
        constructInitialEntities: function (ctx, entityEditor, isEditable) {
            // if the field has a current value, initilize the control with it
            if (ctx.CurrentItem[ctx.CurrentFieldSchema.Name].length > 0) {
                // parse the values into an array
                var values = [];
                if (ctx.CurrentItem[ctx.CurrentFieldSchema.Name]) {
                    if (Array.isArray(ctx.CurrentItem[ctx.CurrentFieldSchema.Name])) {
                        values = ctx.CurrentItem[ctx.CurrentFieldSchema.Name];
                    }
                    else if (ctx.CurrentItem[ctx.CurrentFieldSchema.Name].indexOf(";#") >= 0) {
                        values = ctx.CurrentItem[ctx.CurrentFieldSchema.Name].replace(/^;#/, '').replace(/;#$/, '').split(';#');
                    }
                    else {
                        values = ctx.CurrentItem[ctx.CurrentFieldSchema.Name].split(';');
                    }
                }
                // for each value, push a span into the entity editor div
                $.each(values, function (idx, value) {
                    if (isEditable) {
                        // add an anchor tag to remove this entity
                        var anchor = $('<a/>', {
                            "title": "Remove Entity",
                            "data-fieldname": ctx.CurrentFieldSchema.Name,
                            "data-value": value,
                            "class": "csrdemos-remove",
                            "href": "#"
                        }).text("x");
                    }

                    // create the span from the value and the anchor
                    entityEditor.append($("<span/>", {
                        'title': value,
                        'class': 'csrdemos-entity'
                    }).html(value + (isEditable ? anchor[0].outerHTML : "")));

                    if (isEditable) {
                        // remove the value from the list of potential values, so autocomplete won't allow duplicates
                        if ($.inArray(value, $.entityEditorImpl.source[ctx.CurrentFieldSchema.Name]) > -1) {
                            $.entityEditorImpl.source[ctx.CurrentFieldSchema.Name].splice(
                                $.inArray(value, $.entityEditorImpl.source[ctx.CurrentFieldSchema.Name]), 1);
                        }
                    }
                });
            }
        },

        /*
         * Add the input control to the entity editor
         */
        constructInput: function (ctx, entityEditor) {
            // add an input for the user to type into, this is the autocomplete input
            var input = $('<input/>', {
                'id': ctx.CurrentFieldSchema.Name + '_' + ctx.CurrentFieldSchema.Id + '_EntityEditorInput',
                'name': ctx.CurrentFieldSchema.Name + 'EntityEditorInput',
                'type': 'text',
                'class': 'csrdemos-entityeditorinput'
            });
            if ($.entityEditorImpl.schema[ctx.CurrentFieldSchema.Name].FieldType !== "MultiChoice" && ctx.CurrentFieldValue.length > 0) {
                input.hide();
            }
            entityEditor.append(input);

            // finally, append a span where we'll output any validation errors
            entityEditor.parent().append($('<span/>', {
                'id': ctx.CurrentFieldSchema.Name + 'EntityEditorError',
                'class': 'ms-formvalidation'
            }));
        }
    };

    /*
     * Create an empty overrides object.
     */
    var entityEditorOverrides = {
        Templates: {
            'Fields': {
            }
        }
    };

    /*
     * Add an overrides object for each field we want to customize.
     */
    $.each($($.csrConfig.entityEditorFields), function (i, v) {
        entityEditorOverrides.Templates.Fields[v] = {
            'NewForm': $.entityEditorImpl.inputMethod,
            'EditForm': $.entityEditorImpl.inputMethod,
            'DisplayForm': $.entityEditorImpl.displayMethod,
            'View': $.entityEditorImpl.displayMethod
        };
    });

    /*
     * Add a post render override event to add the autocomplete functionality and other
     * event handlers.
     */
    entityEditorOverrides.OnPostRender = function (ctx) {
        var fieldName = ctx.ListSchema.Field[0].Name;
        if ($.inArray(fieldName, $.csrConfig.entityEditorFields) > -1) {
            var $div = $("#" + fieldName + "EntityEditor");
            var input = $div.find("input.csrdemos-entityeditorinput");

            // initialize the jquery-ui autocomplete on the input
            input.autocomplete({
                source: $.entityEditorImpl.source[fieldName].sort(),
                select: function (e, ui) {
                    return $.entityEditorImpl.selectEntity(fieldName, ui.item.value, this);
                }
            });

            // if the user inputs a return, try to resolve whatever is in the input
            input.keydown(function (e) {
                // if the key is return
                if (e.which === 13) {
                    var val = input.val();
                    // if there is nothing in the input, do nothing
                    if (val.length > 0) {
                        var index = $.inArrayIgnoreCase(val, $.entityEditorImpl.source[fieldName]);
                        if (index > -1) {
                            // if the user typed one of the choices (ignoring case), add that choice
                            $.entityEditorImpl.selectEntity(fieldName, $.entityEditorImpl.source[fieldName][index], input);
                            input.autocomplete("close");
                        }
                        else if ($.entityEditorImpl.schema[fieldName].FillInChoice === true) {
                            // else if fill in choices are allowed, add whatever they typed
                            $.entityEditorImpl.selectEntity(fieldName, val, input);
                            input.autocomplete("close");
                        }
                        else {
                            // else raise a validation error
                            var errorMessage = "'" + val + "' is not resolved; Fill in choices are not support, so all entities must be resolved.";
                            $('#' + fieldName + 'EntityEditorError').attr('role', 'alert').html(errorMessage);
                        }
                    }
                }
                else {
                    // on any other key, just clear the validation error, since we won't know if it's an error until
                    // they hit return or submit
                    $('#' + fieldName + 'EntityEditorError').attr('role', '').html("");
                }
            });

            // if the outer div receives a click event, put focus on the input
            $div.click(function (e) {
                $(e.target).find(".csrdemos-entityeditorinput").focus();
            });
        }
    };

    // register template overrides for partial page loads if MDS is enabled
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) +
            '/Style%20Library/EntityEditorCSR.js';

        RegisterModuleInit(url.toLowerCase(), function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(entityEditorOverrides);
        });
    }

    // also register templates now for non-MDS and full page loads
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(entityEditorOverrides);
})(jQuery);

