var converter = window.markdownit({
    html:         true,
    xhtmlOut:     true,
    breaks:       true,
    linkify:      true,
    typographer:  false
}).use(window.markdownitEmoji).use(window.markdownitFootnote);

var readonlyConverter = window.markdownit({
    html:         true,
    xhtmlOut:     false,
    breaks:       true,
    linkify:      true,
    typographer:  false
}).use(window.markdownitEmoji).use(window.markdownitFootnote);

var SF_CASE_MATCH = '\\b(00[0-9]{6})\\b';
var SF_CASE_NOLINK = new RegExp(SF_CASE_MATCH,'img');
var SF_CASE_LINKAWARE = new RegExp('(<(a|img)\\s+)?.*' + SF_CASE_MATCH + '.*(<\\/a>|\\/>)?','img');

var JIRA_CASE_MATCH = '\\b((BI|BUILD|BFG|BF|BIZSYS|CDRIVER|CSHARP|CXX|CASBAH|CLOUDGTM|CLOUDP|MMS|MMSSUPPORT|CS|DAN|SUPPORT|FREE|COMPASS|EVENTS|CONTENT|SERVER|CORPMKTNG|CORPSEC|CSM|CXXODM|DW|DESIGN|DM|DEPM|DOCS|DOCSP|DRIVERS|EDU|EDUTA|ENGBLOG|ETL|EVG|FACILITIES|FIELD|GERHTP|MGO|HADOOP|HASKELL|HELP|HHVM|INT|ITDEV|JAVA|MAKE|MARKETING|MGOP|MCONNECTOR|ANALYTICS|MCI|GODRIVER|XGENTOOLS|TOOLS|UNI|MDBW|MONGOID|MGOMIRROR|MOTOR|NODE|OB|OFFICEIT|OKRA|PTS|PARTNER|PERF|PERL|PHPC|PHP|PHPLIB|PRODUCT|PS|PROG|PM|DJANGO|PYTHON|PYMODM|JAVARS|SCALARS|RUBY|JAVARX|SCALARX|SCALA|SECURITY|BACKPORT|SFSC|SPARK|SPEC|TECHOPS|TSPROJ|TSOPS|TSWRITING|WRITING|TIG|TPM|UP|VIDEO|WEBSITE|WT)\\-[0-9]{1,6})';
var JIRA_CASE_NOLINK = new RegExp(JIRA_CASE_MATCH,'ig');
var JIRA_CASE_LINKAWARE = new RegExp('(<(a|img)\\s+)?.*' + JIRA_CASE_MATCH + '.*(<\\/a>|\\/>)?','ig');

var FILE_ADDED_MATCH = /(\[Added\sfile:\s&quot;)(.+)(&quot;\])/g;
var FILE_ADDED_MATCH_SPLIT = /(\[Added\sfile:\s&quot;)(.+)(&quot;\])/;

function typeOf( obj ) {
  return ({}).toString.call( obj ).match(/\s(\w+)/)[1].toLowerCase();
}

function convertArticle() {
    $('.commenttext').each(function(index,comment){
        convertComment($(comment),readonlyConverter);
    });
}

function convertComments(container, readonly) {
    if(container === undefined) {
        container = $(document);
    }
    if(typeOf(container) == 'boolean') {
        readonly = container;
        container = $(document);
    }
    container.find('.commenttext').each(function(index,comment){
        var cvt = (readonly ? readonlyConverter : converter);
        convertComment($(comment),cvt);
    });
    return container;
}

function convertComment(comment, converter) {
    var markdownText = $(comment).html();
    if($(comment).hasClass('jiracomment')) {
        markdownText = toM(markdownText);
    }
    var convertedHtml = convertMarkdownText(markdownText);
    $(comment).html(convertedHtml);
    $(comment).removeClass('commenttext').removeClass('jiracomment');
}

function convertMarkdownText(markdownText) {
    var cleanedMarkdownText = markdownText.replace(/&gt;/g,">")
										  .replace(/&lt;/g,"<")
										  .replace(/&amp;/g,"&")
										  .replace(/&quot;/g,'"')
										  .replace(/&#39;/g,"'");
    var htmlWClasses = converter.render(cleanedMarkdownText);

	var matchedFiles = [];
    matchedFiles = htmlWClasses.match(FILE_ADDED_MATCH);
    if(matchedFiles !== null) {
        for(var i=0;i<matchedFiles.length;i++) {
            var stringparts = FILE_ADDED_MATCH_SPLIT.exec(matchedFiles[i]);
            if(stringparts !== null && stringparts.length == 4) {
                var encodedKey = encodeURIComponent(stringparts[2]);
                encodedKey = encodedKey.replace('%2E','.');
                encodedKey = encodedKey.replace('%2D','-');
                encodedKey = encodedKey.replace('%5F','_');
                encodedKey = encodedKey.replace('%2F','/');
                encodedKey = encodedKey.replace('%28','(');
                encodedKey = encodedKey.replace('%29',')');
                var replacement = stringparts[1] + '<a href="" class="s3link attachment-comment-link" data-key="' + encodedKey + '">' + stringparts[2] + '</a>' + stringparts[3];
                htmlWClasses = htmlWClasses.replace(matchedFiles[i],replacement);
            }
        }
    }

	htmlWClasses = htmlWClasses.replace(JIRA_CASE_LINKAWARE,
		function ($0,$1,$2,$3) {
			var aReg = new RegExp('<a\\s.*' + $3 + '.*<\\/a>');
			var imgReg = new RegExp('<img\\s.*' + $3 + '.*\\/>');
			if($1 || $0.match(aReg) || $0.match(imgReg)) {
				return $0;
			} else {
				var jiraMatch;
				var replacements = {};
				var newText = $0;
				while(jiraMatch = JIRA_CASE_NOLINK.exec($0)) {
					var caseString = jiraMatch[0];
					replacements[caseString] = '<a target="_blank" class="case-link jira-case" data-caseid="' + caseString + '" href="https://jira.mongodb.org/browse/' + caseString + '">' + caseString + '</a>';
				}
				for(var rpl in replacements) {
					newText = newText.replace(new RegExp('\\b' + rpl + '\\b', 'g'),replacements[rpl]);
				}
				return newText;
			}
		}
	);

    htmlWClasses = htmlWClasses.replace(SF_CASE_LINKAWARE,
		function ($0,$1,$2,$3) {
			var aReg = new RegExp('<a\\s.*' + $3 + '.*<\\/a>');
			var imgReg = new RegExp('<img\\s.*' + $3 + '.*\\/>');
			if($1 || $0.match(aReg) || $0.match(imgReg)){
				return $0;
			} else {
				var sfscMatch;
				var replacements = {};
				var newText = $0;
				while(sfscMatch = SF_CASE_NOLINK.exec($0)) {
					var caseString = sfscMatch[0];
					replacements[caseString] = '<a target="_blank" class="case-link sfsc-case" data-caseid="' + caseString + '" href="https://support.mongodb.com/case/' + caseString + '">' + caseString + '</a>';
				}
				for(var rpl in replacements) {
					newText = newText.replace(new RegExp('\\b' + rpl + '\\b', 'g'),replacements[rpl]);
				}
				return newText;
			}
		}
	);
    htmlWClasses = $('<div class="mdb"/>').html(htmlWClasses);
    $(htmlWClasses).find("*").addClass("mdb");
    $(htmlWClasses).find("table").addClass("table table-condensed table-striped");
    $(htmlWClasses).find('code').each(function(i, block) {
		//var content = $(block).html();
		//$(block).html(content).text();
		if($(block).parents('pre').length > 0) {
			hljs.highlightBlock(block);
		}
    });
    $(htmlWClasses).find('code').contents()
              .filter(function(){
                return (this.nodeType === 3);
              })
              .each(function() {
                this.nodeValue = this.nodeValue.replace(/&gt;/g,">")
				  							   .replace(/&lt;/g,"<")
				  							   .replace(/&amp;/g,"&")
				  							   .replace(/&quot;/g,'"');
              });
    $(htmlWClasses).find('a').attr('target','_blank');
    return $(htmlWClasses);
}

function toM(textContent) {
    var cleanedMarkdownText = textContent.replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&").replace(/&quot;/g,'"');
    var lc = 0;
    return cleanedMarkdownText
    // Unordered Lists
    .replace(/^[ \t]*(\*+)\s+/gm, function(match, stars) {
        return '\n' + Array(stars.length).join(" ") + '* ';
    })
    // Ordered lists
    .replace(/^[ \t]*(#+)\s+/gm, function(match, nums) {
        return '\n' + Array(nums.length).join(" ") + '1. ';
    })
    // Headers 1-6
    .replace(/^h([0-6])\.(.*)$/gm, function (match, level, content) {
        return '\n' + Array(parseInt(level) + 1).join('#') + content;
    })
    // Forced newlines
    .replace(/\\\\/g, '\n')
    // Bold
    .replace(/\*([^\n\*]+)\*/g, '**$1**')
    // Italic
    .replace(/\_(\S.*)\_/g, '*$1*')
    // Monospaced text
    .replace(/\{\{([^}]+)\}\}/g, '`$1`')
    // Citations
    //.replace(/\?\?((?:.[^?]|[^?].)+)\?\?/g, '<cite>$1</cite>')
    //.replace(/\?\?((?:.[^?]|[^?].)+)\?\?/g, '> $1')
    // Inserts
    .replace(/\+([^+]*)\+/g, '<ins>$1</ins>')
    // Superscript
    .replace(/\^([^^]*)\^/g, '<sup>$1</sup>')
    // Subscript
    .replace(/~([^~]*)~/g, '<sub>$1</sub>')
    // Strikethrough
    .replace(/[\n\s]-(\S+.*?\S)-/g, '~~$1~~')
    // Code Block
    .replace(/\{code(:([a-z]+))?\}/gm, '```$2')
    // Blockquote
    //.replace(/(\{quote\})([^$2]*)\{quote\}/gm, '<blockquote>$2</blockquote>')
    .replace(/(\{quote\})([^\1]*?)\{quote\}/gm, function(match,tag,content){
        return content.replace(/\n/g,'\n> ') + '\n';
    })
    // Pre-formatted text
    .replace(/{noformat}/g, '```')
    // Un-named Links
    .replace(/\[([^|\[\]]+)\]/g, '<$1>')
    // Images (not imported)
    .replace(/^!(.*)!$/g, '<b>Image not imported to new system</b>')
    // Named Links
    .replace(/\[(.+?)\|([^|\[\]]+)\]/g, '[$1]($2)')
    // Single Paragraph Blockquote
    .replace(/^bq\.\s+/gm, '> ')
    // Remove color: unsupported in md
    .replace(/\{color:[^}]+\}([^]*)\{color\}/gm, '$1')
    // Citations
    //.replace(/\?\?(.[^?{2}]+)\?\?/g, '<cite>$1</cite>')
    .replace(/\?\?(.[^?{2}]+)\?\?/g, '<cite>$1</cite>')
    // panel into table
    .replace(/\{panel:title=([^}]*)\}\n?([^]*?)\n?\{panel\}/gm, '\n| $1 |\n| --- |\n| $2 |')
    // table header
    .replace(/^[ \t]*((?:\|\|.*?)+\|\|)[ \t]*$/gm, function (match, headers) {
        var singleBarred =  headers.replace(/\|\|/g,'|');
        return '\n' + singleBarred + '\n' + singleBarred.replace(/\|[^|]+/g, '| --- ');
    })
    // remove leading-space of table headers and rows
    .replace(/^[ \t]*\|/gm, '|');
}