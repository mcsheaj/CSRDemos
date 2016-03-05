(function ($) {

    $.csrConfig = {
        entityEditorFields: [
            'EntityEditor',
            'TagsCovered',
            'TagsNotCovered',
            'SingleTag'
        ],

        starRatingFields: [
            'StarRating',
            'Content1',
            'Relevance',
            'Presentation'
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
