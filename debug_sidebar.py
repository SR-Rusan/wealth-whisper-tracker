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
                        
                        // Let's find any elements containing 'bKash' in their text
                        var bkashElements = [];
                        var all = document.querySelectorAll('*');
                        all.forEach(function(el) {
                            if (el.textContent && el.textContent.includes('bKash') && el.children.length < 5) {
                                bkashElements.push({
                                    tagName: el.tagName,
                                    className: el.className,
                                    text: el.textContent.trim().substring(0, 100),
                                    html: el.outerHTML.substring(0, 200)
                                });
                            }
                        });
                        res.bkashElements = bkashElements.slice(0, 10);
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
