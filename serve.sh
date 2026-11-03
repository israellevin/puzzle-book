#!/usr/bin/bash

validate_html() {
    output="$(curl -sH "Content-Type: text/html; charset=utf-8" --data-binary "$(< index.html)" \
        https://validator.w3.org/nu/?out=json | \
        node -pe "JSON.parse(require('fs').readFileSync(0, 'utf-8'))
            .messages.filter(m => m.type === 'error')
            .map(m => m.lastLine + ': ' + m.message + '\n' + m.extract)
            .join('\n')"
    )"
    if [ "$output" ]; then
        echo "$output"
        exit 1
    fi
    echo HTML is valid
}

validate_js() {
    npx eslint index.js && echo JS is valid || exit 1
}

cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1
validate_html
validate_js
python3 -m http.server
