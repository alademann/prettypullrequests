
var isGitHub = $("meta[property='og:site_name']").attr('content') === 'GitHub';

chrome.storage.sync.get({url: ''}, function(items) {
    if (items.url == window.location.origin ||
        "https://github.com" === window.location.origin
    ) {
        $('<span class="collapse-lines">' +
                '<label><input type="checkbox" class="js-collapse-additions" checked="yes">+</label>' +
                '<label><input type="checkbox" class="js-collapse-deletions" checked="yes">-</label>' +
            '</span>'
        ).insertAfter('.actions');

        $('<div class="bottom-collapse meta">Click to Collapse</div>').insertAfter('.data.highlight.blob-wrapper');

        var $body = $('body');

        $body.on('click', '.js-selectable-text, .bottom-collapse', function (e) {
            var span = $(this).closest('[id^=diff-]');
            span.children('.data, .image').slideToggle(200);
            if ($(e.target).hasClass('bottom-collapse')) {
                $(this).closest('.bottom-collapse').toggle();
            } else {
                span.children('.bottom-collapse').toggle();
            }
            span.children('.meta')[0].scrollIntoViewIfNeeded();
        });

        $body.on('click', '.js-collapse-additions', collapseAdditions);

        $body.on('click', '.js-collapse-deletions', collapseDeletions);

        // Actions per changed file
        chrome.runtime.onConnect.addListener(function (port) {
            console.assert(port.name == "pullrequest");

            port.onMessage.addListener(function (msg) {
                if (msg.collapse !== undefined) {
                    collapseDiffs(msg.collapse);
                }
                if (msg.expand !== undefined) {
                    expandDiffs(msg.expand);
                }
                if (msg.goto !== undefined) {
                    getDiffSpans(msg.goto)[0].scrollIntoViewIfNeeded();
                }
            });
        });

        // Create the tree with the changed files after pressing the octocat button
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.getPaths) {
                var paths = $.map($('.file .js-selectable-text'), function (item) {
                    return $.trim(item.innerHTML);
                });
                if (paths.length > 0) {
                    sendResponse({paths: paths});
                }
            }
        });
    }
});

function collapseAdditions () {
    if (isGitHub) {
        $(this).closest('[id^=diff-]').find('.blob-code-addition').parent('tr').slideToggle();
    } else {
        $(this).closest('[id^=diff-]').find('.gi').slideToggle();
    }
}

function collapseDeletions () {
    if (isGitHub) {
        $(this).closest('[id^=diff-]').find('.blob-code-deletion').parent('tr').slideToggle();
    } else {
        $(this).closest('[id^=diff-]').find('.gd').slideToggle();
    }
}

function getDiffSpans (path) {
    return $('.js-selectable-text').filter(function () {
        return this.innerHTML.trim().match(path);
    });
}

function collapseDiffs (path) {
    var spans = getDiffSpans(path).closest('[id^=diff-]');
    spans.children('.data, .image').slideUp(200);
    spans.children('.bottom-collapse').hide();
}

function expandDiffs (path) {
    var spans = getDiffSpans(path).closest('[id^=diff-]');
    spans.children('.data, .image').slideDown(200);
    spans.children('.bottom-collapse').show();
}

