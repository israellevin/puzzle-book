// Lint config for the site scripts.
export default [{
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'comma-dangle': ['error', 'never'],
        'indent': ['error', 4, {'SwitchCase': 1}],
        'linebreak-style': ['error', 'unix'],
        'max-len': ['error', {'code': 120}],
        'quotes': ['error', 'single', {'allowTemplateLiterals': true}],
        'semi': ['error', 'always'],
        'space-before-function-paren': ['error', 'never'],
        'keyword-spacing': ['error', {after: false, overrides: {
            'case': {'after': true},
            'const': {'after': true},
            'default': {'after': true},
            'else': {'after': true},
            'export': {'after': true},
            'from': {'after': true},
            'import': {'after': true},
            'of': {'after': true},
            'return': {'after': true},
            'try': {'after': true}
        }}]
    }
}];
