import subprocess
import time

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
                        var input = document.querySelector('input[placeholder*=\\"Search\\"], input[type=\\"search\\"], input');
                        if (input) {
                            input.focus();
                            input.value = 'bKash';
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            return 'INPUT_FOUND_AND_TYPED';
                        }
                        return 'INPUT_NOT_FOUND';
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

# Type bKash into search
res = subprocess.run(['osascript', '-e', APPLESCRIPT], capture_output=True, text=True)
print("Type result:", res.stdout.strip())

# Wait 2 seconds for search results to render
time.sleep(2)

# Now check the list of conversation names
CHECK_SCRIPT = """
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
        tell messagesTab
            do JavaScript "
                (function() {
                    var names = [];
                    // Look for any elements that might contain the search results
                    var elements = document.querySelectorAll('[role=\\"listitem\\"], mws-conversation-list-item, a, div');
                    elements.forEach(function(el) {
                        var text = el.textContent || '';
                        if (text.toLowerCase().includes('bkash')) {
                            names.push(el.tagName + ' class: ' + el.className + ' text: ' + text.trim().substring(0, 50));
                        }
                    });
                    return JSON.stringify(names);
                })()
            "
        end tell
    else
        return "NOT_FOUND"
    end if
end tell
"""

res2 = subprocess.run(['osascript', '-e', CHECK_SCRIPT], capture_output=True, text=True)
print("Search results found in DOM:", res2.stdout.strip())
