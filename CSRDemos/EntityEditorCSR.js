/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    // test is form with client side rendering
    if (typeof (SPClientTemplates) === 'undefined')
        return;

    // test at least one field is configured to use the entity editor client side rendering
    if (typeof ($.csrConfig) !== 'object' || typeof ($.csrConfig.entityEditorFields) !== 'object' || !$.csrConfig.entityEditorFields.length)
        return;

    // wish jQuery inArray had an ignore case option ;)
    $.inArrayIgnoreCase = function(value, array) {
        value = value.toLowerCase();
        array = array.map(function (v) { return v.toLowerCase(); });
        return $.inArray(value, array);
    };

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

            // create a custom validator with an object literal insead of new and a constructor
            fieldValidators.RegisterValidator({
                schema: current.fieldSchema,

                Validate: function (value) {
                    var isError = false;
                    var errorMessage = '';

                    if (this.schema.FillInChoice === false) {
                        var entityInput = $('#' + this.schema.Name + 'EntityEditor').find("input.csrdemos-entityeditorinput");
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
        getFieldValue: function (fieldName) {
            var result = [];

            var entityEditorDiv = $('#' + fieldName + 'EntityEditor');
            var entityEditorInput = entityEditorDiv.find(".csrdemos-entityeditorinput");

            // if there is an unresolved value in the input, see if it matches a valid choice (case insensative)
            if (entityEditorInput.val().length > 0) {
                var index = $.inArrayIgnoreCase(entityEditorInput.val(), $.entityEditorImpl.source[fieldName]);
                if (index > -1) {
                    // if we found a valid choice, add it as an entity, clear the input, and clear the validation error if any
                    $.entityEditorImpl.selectEntity(fieldName, $.entityEditorImpl.source[fieldName][index], entityEditorInput);
                    $('#' + fieldName + 'EntityEditorError').attr('role', '').html("");
                }
            }

            // if there is still an unresolved value in input, and fill in choices are allowed, add whatever
            // is in input as an entity
            if ($.entityEditorImpl.schema[fieldName].FillInChoice === true) {
                if (entityEditorInput.val().length > 0) {
                    $.entityEditorImpl.selectEntity(fieldName, entityEditorInput.val(), entityEditorInput);
                    $('#' + fieldName + 'EntityEditorError').attr('role', '').html("");
                }
            }

            // now scoop up all of the entities (all the span.csrdemos-entity elements)
            entityEditorDiv.find('.csrdemos-entity').each(function () {
                result.push($(this).find("a").attr("data-value"));
            });

            // if this is a multi-choice field, join the array and format as a multi-choice value
            if ($.entityEditorImpl.schema[fieldName].FieldType === "MultiChoice") {
                if (result.length === 0) {
                    return '';
                }
                return ';#' + result.join(';#') + ';#';
            }

            // otherwise it's a single choice, we don't have to worry about finding multiple entities because the
            // input gets hidden for single choice any time we have an entity
            return result.length === 1 ? result[0] : '';
        },

        /*
         * Shove a link to the stylesheet into the DOM one time.
         */
        getCss: function () {
            if (!$('body').attr('data-entityeditorcssadded')) {
                var css = _spPageContextInfo.siteAbsoluteUrl +
                    '/Style%20Library/entityeditor.css';
                $('head').append(
                    '<link rel="stylesheet" type="text/css" href="' + css + '">');
                css = _spPageContextInfo.siteAbsoluteUrl +
                    "/Style%20Library/jquery-ui.css";
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
            'EditForm': $.entityEditorImpl.inputMethod
        };
    });

    /*
     * Add a post render override event to add the autocomplete functionality and other
     * event handlers.
     */
    entityEditorOverrides.OnPostRender = function (ctx) {
        var fieldName = ctx.ListSchema.Field[0].Name;
        if ($.inArray(fieldName, $.csrConfig.entityEditorFields) > -1) {
            var div = $("#" + fieldName + "EntityEditor");
            var input = div.find("input.csrdemos-entityeditorinput");

            // initialize the jquery-ui autocomplete on the input
            input.autocomplete({
                source: $.entityEditorImpl.source[fieldName].sort(),
                select: function (e, ui) {
                    return $.entityEditorImpl.selectEntity(fieldName, ui.item.value, this);
                }
            });

            // if the user inputs a return, try to resolve whatever is in the input=
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
            div.click(function (e) {
                var div = $(e.target);
                div.find(".csrdemos-entityeditorinput").focus();
            });
        }
    };

    // register my template overrides
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = (_spPageContextInfo.siteServerRelativeUrl === '/' ? "" : _spPageContextInfo.siteServerRelativeUrl) +
            '/Style%20Library/EntityEditorCSR.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url.toLowerCase(), function () {
            SPClientTemplates.TemplateManager.RegisterTemplateOverrides(entityEditorOverrides);
        });
    }

    // also just register for full page loads (F5/refresh)
    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(entityEditorOverrides);
})(jQuery);

