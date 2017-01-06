// // List Form - Tabs Sample 
// Muawiyah Shannak , @MuShannak 

var currentFormUniqueId;
var currentFormWebPartId;

// Use "Multi String" javascript to embed the required css 
var MultiString = function (f) {
    return f.toString().split('\n').slice(1, -1).join('\n');
}
var tabsStyle = MultiString(function () {/** 
**/
});

var tabsObj = [
    ["General", ["Title", "Age", "Married", "Mobile", "SSN"]],
    ["Work", ["Manager", "Salary", "Phone", "Email"]],
    ["Other", ["Comments"]]
];


(function () {

    // jQuery library is required in this sample 
    // Fallback to loading jQuery from a CDN path if the local is unavailable 
    (window.jQuery || document.write('<script src="//ajax.aspnetcdn.com/ajax/jquery/jquery-1.10.0.min.js"><\/script>'));

    var tabsContext = {};
    tabsContext.OnPreRender = TabsOnPreRender;
    tabsContext.OnPostRender = TabsOnPostRender;


    // accordionContext.OnPostRender = accordionOnPostRender; 
    tabsContext.Templates = {};

    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(tabsContext);

})();

function TabsOnPreRender(ctx) {
    if (!currentFormUniqueId) {

        currentFormUniqueId = ctx.FormUniqueId;
        currentFormWebPartId = "WebPart" + ctx.FormUniqueId;

        jQuery(document).ready(function () {

            var tabHTMLTemplate = "<li class='{class}'><a href='#{Index}'>{Title}</a></li>";
            var tabClass;
            var tabsHTML = "";

            for (var i = 0; i < tabsObj.length; i++) {
                tabClass = "";
                if (i == 0) { tabClass = "active"; }
                tabsHTML += tabHTMLTemplate.replace(/{Index}/g, i).replace(/{Title}/g, tabsObj[i][0]).replace(/{class}/g, tabClass)
            }

            jQuery("#" + currentFormWebPartId).prepend("<ul class='tabs'>" + tabsHTML + "</ul>");


            jQuery('.tabs li a').on('click', function (e) {
                var currentIndex = jQuery(this).attr('href').replace("#", "");
                showTabControls(currentIndex);
                jQuery(this).parent('li').addClass('active').siblings().removeClass('active');
                e.preventDefault();
            });

            showTabControls(0);

            jQuery("#" + currentFormWebPartId).prepend("<!--mce:0-->");
        });

    }
}

function TabsOnPostRender(ctx) {
    var controlId = ctx.ListSchema.Field[0].Name + "_" + ctx.ListSchema.Field[0].Id;
    jQuery("[id^='" + controlId + "']").closest("tr").attr('id', 'tr_' + ctx.ListSchema.Field[0].Name).hide();
}

function showTabControls(index) {
    jQuery("#" + currentFormWebPartId + " [id^='tr_']").hide();

    for (var i = 0; i < tabsObj[index][1].length; i++) {
        jQuery("[id^='tr_" + tabsObj[index][1][i] + "']").show();
    }
}