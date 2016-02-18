/*
 *  @copyright 2016 Joe McShea
 *  @license under the MIT license:
 *     http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
    if (typeof (SPClientTemplates) === 'undefined')
        return;

    entityEditorFields = [
        //'TagsCovered',
        'TagsNotCovered'
    ];

    /*
     * Implementation class for the overrides.
     */
    $.entityEditorImpl = {
        source: {},

        /*
         * Implementation for the new and edit forms.
         */
        inputMethod: function (ctx) {
            $.entityEditorImpl.getCss();

            var current = SPClientTemplates.Utility.GetFormContextForCurrentField(ctx);

            // construct the html for our control and return it
            var result = $('<p/>');
            var entityEditor = $('<div/>', {
                'id': current.fieldName + 'EntityEditor',
                'class': 'ui-helper-clearfix csrdemos-entityeditor',
                'onclick': 'handleClickOnEntityEditor(event)',
                'data-fieldname': current.fieldName
            });
            result.append(entityEditor);

            $.entityEditorImpl.source[current.fieldName] = current.fieldSchema.MultiChoices;

            if (ctx.CurrentFieldValue.length > 0) {
                var values = ctx.CurrentFieldValue.replace(/^;#/, '').replace(/;#$/, '').split(';#');

                $.each(values, function (idx, value) {
                    var anchor = $('<a/>', {
                        "title": "Remove Entity",
                        "data-fieldname": current.fieldName,
                        "data-value": value,
                        "class": "csrdemos-remove",
                        "href": "#"
                    }).text("x");

                    entityEditor.append($("<span/>", {
                        'title': value,
                        'class': 'csrdemos-entity'
                    }).html(value + anchor[0].outerHTML));

                    if ($.inArray(value, $.entityEditorImpl.source[current.fieldName]) > -1) {
                        $.entityEditorImpl.source[current.fieldName].splice(
                            $.inArray(value, $.entityEditorImpl.source[current.fieldName]), 1);
                    }
                });
            }

            var input = $('<input/>', {
                'id': current.fieldName + 'EntityEditorInput',
                'name': current.fieldName + 'EntityEditorInput',
                'type': 'text',
                'class': 'csrdemos-entityeditorinput'
            });
            entityEditor.append(input);

            result.append($('<span/>', {
                'id': current.fieldName + 'EntityEditorError',
                'class': 'ms-formvalidation ms-csrformvalidation'
            }));

            // register a callback to return the current value
            current.registerGetValueCallback(
                current.fieldName,
                $.entityEditorImpl.getFieldValue.bind(null, current.fieldName));

            $(".ms-formtable").on("click", ".csrdemos-remove", function (e) {
                e.stopImmediatePropagation();
                var fieldName = $(this).attr("data-fieldname");
                var value = $(this).attr("data-value");
                var entityEditor = $(this).closest(".csrdemos-entityeditor");
                var entityEditorInput = $(this).closest(".csrdemos-entityeditor").find("input.csrdemos-entityeditorinput");
                $.entityEditorImpl.source[fieldName].push(value);
                entityEditorInput.autocomplete("option", "source", $.entityEditorImpl.source[fieldName].sort()).focus();
                $(this).parent().remove();
            });

            return result.html();
        },

        /*
         * Setup validation for the input form.
         */
        registerValidators: function(current) {
            // create a validator set
            var fieldValidators = new SPClientForms.ClientValidation.ValidatorSet();
            fieldValidators.RegisterValidator(new entityEditorFieldValidator());

            // if required, add a required field validator
            if (current.fieldSchema.Required) {
                fieldValidators.RegisterValidator(new SPClientForms.ClientValidation.RequiredValidator());
            }

            // register a callback method for the validators
            current.registerValidationErrorCallback(current.fieldName, function (error) {
                $('#' + current.fieldName + 'Error').attr('role', 'alert').html(error.errorMessage);
            });

            // register the validators
            current.registerClientValidator(current.fieldName, fieldValidators);
        },

        /*
         * Return the current value from the data-value attribute of my div.
         */
        getFieldValue: function (fieldName) {
            return $.entityEditorImpl.getFieldValueImpl(fieldName);
        },

        getFieldValueImpl: function(fieldName) {
            var result = [];

            var entityEditorDiv = $('#' + fieldName + 'EntityEditor');
            entityEditorDiv.find('.csrdemos-entity').each(function () {
                result.push($(this).find("a").attr("data-value"));
            });

            var entityEditorInput = entityEditorDiv.find(".csrdemos-entityeditorinput");
            if (entityEditorInput.val().length > 0) {
                result.push(entityEditorInput.val());
            }

            return ';#' + result.join(';#') + ';#';
        },

        /*
         * Shove a link to the stylesheet into the DOM one time.
         */
        getCss: function () {
            if (!$('body').attr('data-entityeditorcssadded')) {
                var css = _spPageContextInfo.siteAbsoluteUrl +
                    '/Style Library/ContentTypeJSLink/entityeditor.css';
                $('head').append(
                    '<link rel="stylesheet" type="text/css" href="' + css + '">');
                css = _spPageContextInfo.siteAbsoluteUrl +
                    "/Style Library/jquery-ui.css";
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
            $(entityEditorInput).autocomplete(
                "option", "source", $.entityEditorImpl.source[fieldName].sort());
            $(entityEditorInput).val("");

            return false;
        }
    };

    /*
     * Onclick callback; set the current value by determining which star
     * was clicked upon.
     */
    handleClickOnEntityEditor = function (e) {
        var div = $(e.target);
        div.find(".csrdemos-entityeditorinput").focus();
    }

    /*
     * A custom validator is just an object with a Validate method. It takes in the
     * value and returns an error based on whatever criteria it chooses; in this case
     * berating people for a wishy-washy answer (i.e. 3).
     */
    var entityEditorFieldValidator = function () {
        entityEditorFieldValidator.prototype.Validate = function (value) {
            var isError = false;
            var errorMessage = '';
            // TBD
            return new SPClientForms.ClientValidation.ValidationResult(isError, errorMessage);
        };
    };

    /*
     * Create overrides for the new, edit, and display forms and views for the star ratings field.
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
    $.each($(entityEditorFields), function (i, v) {
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
        if ($.inArray(fieldName, entityEditorFields) > -1) {
            $("#" + fieldName + "EntityEditor").find("input.csrdemos-entityeditorinput").autocomplete({
                source: $.entityEditorImpl.source[fieldName].sort(),
                select: function (e, ui) {
                    return $.entityEditorImpl.selectEntity(fieldName, ui.item.value, this);
                }
            });
        }
    };

    // register my template overrides
    if (typeof _spPageContextInfo != 'undefined' && _spPageContextInfo != null) {
        // MDS is enabled
        var url = _spPageContextInfo.siteServerRelativeUrl +
            '/style library/contenttypejslink/entityeditorcsr.js';
        // register a callback to register the templates on partial page loads
        RegisterModuleInit(url, function () {
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

