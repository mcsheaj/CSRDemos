(function ($) {

    (function ($) {

        $.csrConfig = {
            starRatingFields: [
                'Content1'
            ],

            entityEditorFields: [
            ],

            csrModules: {
                entityEditor: {
                    name: "entityEditor",
                    displayName: "Entity Editor",
                    types: ["Choice"]
                },
                starRating: {
                    name: "starRating",
                    displayName: "Star Rating",
                    types: ["Number"]
                }
            }
        };

    })(jQuery);
})(jQuery);
