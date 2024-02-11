#!/usr/bin/bash

validate_html() {
    output="$(curl -sH "Content-Type: text/html; charset=utf-8" --data-binary "$(< ./index.html)" \
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
    npx eslint ./index.js
    eslint ./index.js
    [ $? = 0 ] && echo JS is valid || exit 1
}

validate() {
    echo
    validate_html
    validate_js
}

cd "$(dirname "${BASH_SOURCE[0]}")"
validate
trap validate EXIT
npx tailwindcss@3.1.8 -i ./tailwind.css -o ./index.css --watch &
npx http-server -p 8000 -c-1
