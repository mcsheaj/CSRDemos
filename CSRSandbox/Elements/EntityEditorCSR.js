﻿/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    // test is form with client side rendering
    if (typeof (SPClientTemplates) === 'undefined')
        return;

    // test at least one field is configured to use the entity editor client side rendering
    if (typeof ($.entityEditorFields) !== 'object' || !$.entityEditorFields.length)
        return;

    /*
     * Implementation class for the overrides.
     */
    $.entityEditorImpl = {
        source: {},
        schema: {},

        /*
         * Implementation for the new and edit forms.
         */
        inputMethod: function (ctx) {
            $.entityEditorImpl.getCss();
            var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

            // save some stuff from the schema we're going to need later
            $.entityEditorImpl.source[current.fieldName] = current.fieldSchema.MultiChoices;
            $.entityEditorImpl.schema[current.fieldName] = current.fieldSchema;

            // construct the outer html for our control
            var result = $.entityEditorImpl.constructOuterContainer(current);
            var entityEditor = result.find(".csrdemos-entityeditor");

            // initialize the editor with current values
            $.entityEditorImpl.constructInitialEntities(ctx, current, entityEditor);

            // add the text input to the entitiy edity div
            $.entityEditorImpl.constructInput(ctx, current, entityEditor);

            // register a callback to return the current value
            current.registerGetValueCallback(
                current.fieldName,
                $.entityEditorImpl.getFieldValue.bind($.entityEditorImpl, current.fieldName));

            // register validators for this control
            $.entityEditorImpl.registerValidators(current);

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

            return result.html();
        },

        /*
         * Setup validation for the input form.
         */
        registerValidators: function (current) {
            // create a validator set
            var fieldValidators = new SPClientForms.ClientValidation.ValidatorSet();
            fieldValidators.RegisterValidator(new noFillinValidator(current.fieldSchema));

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
        getFieldValue: function (fieldName) {
            var result = [];

            var entityEditorDiv = $('#' + fieldName + 'EntityEditor');
            entityEditorDiv.find('.csrdemos-entity').each(function () {
                result.push($(this).find("a").attr("data-value"));
            });

            if ($.entityEditorImpl.schema[fieldName].FillInChoice === false) {
                var entityEditorInput = entityEditorDiv.find(".csrdemos-entityeditorinput");
                if (entityEditorInput.val().length > 0) {
                    result.push(entityEditorInput.val());
                }
            }

            if ($.entityEditorImpl.schema[fieldName].FieldType === "MultiChoice") {
                return ';#' + result.join(';#') + ';#';
            }
            return result[0];
        },

        /*
         * Shove a link to the stylesheet into the DOM one time.
         */
        getCss: function () {
            if (!$('body').attr('data-entityeditorcssadded')) {
                var css = _spPageContextInfo.siteAbsoluteUrl +
                    '/style library/entityeditor.css';
                $('head').append(
                    '<link rel="stylesheet" type="text/css" href="' + css + '">');
                css = _spPageContextInfo.siteAbsoluteUrl +
                    "/style library/jquery-ui.css";
                $('head').append(
                    '<link rel="stylesheet" type="text/css" href="' + css + '">');
                $('body').attr('data-entityeditorcssadded', 'true');
            }
        },

        /*
         * Select an entity from the autocomplete list.
         */
        selectEntity: function (fieldName, value, entityEditorInput) {
            var span = $("<span>", {
                "class": "csrdemos-entity",
                "title": "Remove Entity",
                "data-fieldname": fieldName
            }).text(value);
            $("<a>", {
                "class": "csrdemos-remove",
                "href": "#",
                "title": "Remove Entity",
                "data-fieldname": fieldName,
                "data-value": value
            }).text("x").appendTo(span);
            span.insertBefore(entityEditorInput);

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
        constructOuterContainer: function (current) {
            var result = $('<p/>');
            var entityEditor = $('<div/>', {
                'id': current.fieldName + 'EntityEditor',
                'class': 'ui-helper-clearfix csrdemos-entityeditor',
                'data-fieldname': current.fieldName
            });
            result.append(entityEditor);
            return result;
        },

        /*
         * Add a span for each entity in ctx.CurrentFieldValue.
         */
        constructInitialEntities: function (ctx, current, entityEditor) {
            // if the field has a current value, initilize the control with it
            if (ctx.CurrentFieldValue.length > 0) {
                // parse the values into an array
                var values = ctx.CurrentFieldValue.replace(/^;#/, '').replace(/;#$/, '').split(';#');

                // for each value, push a span into the entity editor div
                $.each(values, function (idx, value) {
                    // add an anchor tag to remove this entity
                    var anchor = $('<a/>', {
                        "title": "Remove Entity",
                        "data-fieldname": current.fieldName,
                        "data-value": value,
                        "class": "csrdemos-remove",
                        "href": "#"
                    }).text("x");

                    // create the span from the value and the anchor
                    entityEditor.append($("<span/>", {
                        'title': value,
                        'class': 'csrdemos-entity'
                    }).html(value + anchor[0].outerHTML));

                    // remove the value from the list of potential values, so autocomplete won't allow duplicates
                    if ($.inArray(value, $.entityEditorImpl.source[current.fieldName]) > -1) {
                        $.entityEditorImpl.source[current.fieldName].splice(
                            $.inArray(value, $.entityEditorImpl.source[current.fieldName]), 1);
                    }
                });
            }
        },

        /*
         * Add the input control to the entity editor
         */
        constructInput: function (ctx, current, entityEditor) {
            // add an input for the user to type into, this is the autocomplete input
            var input = $('<input/>', {
                'id': current.fieldName + 'EntityEditorInput',
                'name': current.fieldName + 'EntityEditorInput',
                'type': 'text',
                'class': 'csrdemos-entityeditorinput'
            });
            if ($.entityEditorImpl.schema[current.fieldName].FieldType !== "MultiChoice" && ctx.CurrentFieldValue.length > 0) {
                input.hide();
            }
            entityEditor.append(input);

            // finally, append a span where we'll output any validation errors
            entityEditor.parent().append($('<span/>', {
                'id': current.fieldName + 'EntityEditorError',
                'class': 'ms-formvalidation ms-csrformvalidation'
            }));
        }
    };

    /*
     * A custom validator is just an object with a Validate method. 
     */
    var noFillinValidator = function (schema) {
        var obj = new Object();
        obj.schema = schema;
        obj.Validate = function (value) {
            var isError = false;
            var errorMessage = '';

            if (this.schema.FillInChoice === false) {
                var entityInput = $('#' + this.schema.Name + 'EntityEditor').find("input.csrdemos-entityeditorinput");
                if (entityInput.val().length > 0) {
                    isError = true;
                    errorMessage = "'"+value+"' is not resolved; Fill in choices are not support, so all entities must be resolved.";
                }
            }

            return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
        };
        return obj;
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
    $.each($($.entityEditorFields), function (i, v) {
        entityEditorOverrides.Templates.Fields[v] = {
            'NewForm': $.entityEditorImpl.inputMethod,
            'EditForm': $.entityEditorImpl.inputMethod
        };
    });

    /*
     * Add a post render override event to add the autocomplete functionality
     */
    entityEditorOverrides.OnPostRender = function (ctx) {
        var fieldName = ctx.ListSchema.Field[0].Name;
        if ($.inArray(fieldName, $.entityEditorFields) > -1) {
            var div = $("#" + fieldName + "EntityEditor");
            div.find("input.csrdemos-entityeditorinput").autocomplete({
                source: $.entityEditorImpl.source[fieldName].sort(),
                select: function (e, ui) {
                    return $.entityEditorImpl.selectEntity(fieldName, ui.item.value, this);
                }
            });
            div.click(function (e) {
                var div = $(e.target);
                div.find(".csrdemos-entityeditorinput").focus();
            });
        }
    };

    // register my template overrides
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = _spPageContextInfo.siteServerRelativeUrl +
            '/style library/entityeditorcsr.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url.toLowerCase(), function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(entityEditorOverrides);
        });
        // also just register for full page loads (F5/refresh)
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(entityEditorOverrides);
    } else {
        // if no _spPageContextInfo, then this is a full page load regardless of 
        // MDS being enabled or not, so just register normally
        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(entityEditorOverrides);
    }
})(jQuery);

