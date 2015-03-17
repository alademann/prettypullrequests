
var isGitHub = $("meta[property='og:site_name']").attr('content') === 'GitHub';
var expandedDiffText  = 'Collapse Diff';
var collapsedDiffText = 'Expand Diff';
var expandAllText = 'Expand All';
var collapseAllText = 'Collapse All';

var allDiffCount,
    expandedDiffCount,
    collapsedDiffCount,
    collapseAllBtn,
    expandAllBtn;

chrome.storage.sync.get({url: ''}, function(items) {
    if (items.url == window.location.origin ||
        "https://github.com" === window.location.origin
    ) {
        $('<span class="collapse-lines">' +
                '<label><input type="checkbox" class="js-collapse-additions" checked="yes">+</label>' +
                '<label><input type="checkbox" class="js-collapse-deletions" checked="yes">-</label>' +
            '</span>'
        ).insertAfter('.actions');

        $('<div class="bottom-collapse meta" data-collapsed="false">' + expandedDiffText + '</div>').insertAfter('.data.highlight.blob-wrapper');

        $('<div class="button-group right pretty-pr-button-group" id="pretty-pr-expand-collapse-all"><button type="button" class="minibutton" id="pretty-pr-collapse-all">' + collapseAllText + '</button><button type="button" class="minibutton" id="pretty-pr-expand-all">' + expandAllText + '</button></div>')
            .prependTo('#toc');

        var $body = $('body');

        collapseAllBtn = $('#pretty-pr-expand-collapse-all');
        expandAllBtn = $('#pretty-pr-expand-expand-all');

        $body.on('click', '#pretty-pr-expand-all', function (e) {
            $('.bottom-collapse[data-collapsed="true"]').click();
        });

        $body.on('click', '#pretty-pr-collapse-all', function (e) {
            $('.bottom-collapse[data-collapsed="false"]').click();
        });

        $body.on('click', '.js-selectable-text, .bottom-collapse', function (event) {
            toggleDiffVisibility(this, event);
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

        allDiffCount = $('.js-issues-results').find('.bottom-collapse').length;
    }
});

function isDiffCollapsed(bottomCollapseElem) {
    return bottomCollapseElem.attr('data-collapsed') === 'true';
}

function toggleDiffVisibility(clickedElem, event) {
    var span = $(clickedElem).closest('[id^=diff-]');
    var bottomCollapse;

    span.children('.data, .image').slideToggle(200);

    if ($(event.target).hasClass('bottom-collapse')) {
        bottomCollapse = $(clickedElem).closest('.bottom-collapse');
    } else {
        bottomCollapse = span.children('.bottom-collapse');
    }

    if (isDiffCollapsed(bottomCollapse)) {
        bottomCollapse
            .attr('data-collapsed', 'false')
            .text(expandedDiffText);
    } else {
        bottomCollapse
            .attr('data-collapsed', 'true')
            .text(collapsedDiffText);
    }

    span.children('.meta')[0].scrollIntoViewIfNeeded();

    updateDiffVisibilityCounts();
}

function updateDiffVisibilityCounts() {
    expandedDiffCount = $('.bottom-collapse[data-collapsed="false"]').length;
    collapsedDiffCount = $('.bottom-collapse[data-collapsed="true"]').length;

    updateExpandCollapseAllButtonStates();
}

function updateExpandCollapseAllButtonStates() {
    if (expandedDiffCount === allDiffCount) {
        expandAllBtn
            .prop('disabled', true)
            .addClass('disabled');
    } else {
        expandAllBtn
            .prop('disabled', false)
            .removeClass('disabled');
    }

    if (collapsedDiffCount === allDiffCount) {
        collapseAllBtn
            .prop('disabled', true)
            .addClass('disabled');
    } else {
        collapseAllBtn
            .prop('disabled', false)
            .removeClass('disabled');
    }
}

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
    spans.children('.bottom-collapse').text(collapsedDiffText);

    updateDiffVisibilityCounts();
}

function expandDiffs (path) {
    var spans = getDiffSpans(path).closest('[id^=diff-]');
    spans.children('.data, .image').slideDown(200);
    spans.children('.bottom-collapse').text(expandedDiffText);

    updateDiffVisibilityCounts();
}

