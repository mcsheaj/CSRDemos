(function ($) {

    $.csrConfig = {
        starRatingFields: [
            'StarRating',
            'Content1',
            'Relevance',
            'Presentation'
        ],

        entityEditorFields: [
            'EntityEditor',
            'TagsCovered',
            'TagsNotCovered',
            'SingleTag'
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
