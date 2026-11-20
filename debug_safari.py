import subprocess

APPLESCRIPT = """
tell application "Safari"
    set messagesTab to missing value
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t starts with "https://messages.google.com" then
                set messagesTab to t
                exit repeat
            end if
        end repeat
        if messagesTab is not missing value then exit repeat
    end repeat
    
    if messagesTab is not missing value then
        try
            tell messagesTab
                do JavaScript "
                    (function() {
                        var res = {};
                        
                        // 1. Check if bKash conversation element is found
                        var nameElements = document.querySelectorAll('h3, h4, span, .name, .conversation-name, .title');
                        var foundNames = [];
                        nameElements.forEach(function(el) {
                            foundNames.push(el.textContent.trim());
                        });
                        res.foundNames = foundNames.slice(0, 10); // get first 10 names

                        // 2. Check if scroll container is found
                        var scrollContainer = document.querySelector('mws-message-list, .messages-list, [data-scroll-target], .message-list');
                        res.hasScrollContainer = !!scrollContainer;

                        // 3. Check all elements containing 'Tk' or 'TxnID'
                        var texts = [];
                        var elements = document.querySelectorAll('span, p, div, mws-message-body-html, mws-text-message-part');
                        elements.forEach(function(el) {
                            var txt = el.textContent || '';
                            if (txt.includes('Tk') || txt.includes('TxnID')) {
                                texts.push(txt.substring(0, 50)); // first 50 chars for debug
                            }
                        });
                        res.foundTexts = texts.slice(0, 10);
                        
                        return JSON.stringify(res);
                    })()
                "
            end tell
        on error errMsg
            return "ERROR: " & errMsg
        end try
    else
        return "NOT_FOUND"
    end if
end tell
"""

process = subprocess.Popen(['osascript', '-e', APPLESCRIPT], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = process.communicate()
print("STDOUT:", stdout.strip())
print("STDERR:", stderr.strip())
