module.exports = {
    'env': {
        'browser': true,
        'es2021': true
    },
    'extends': 'eslint:recommended',
    'overrides': [
        {
            'env': {
                'node': true
            },
            'files': [
                '.eslintrc.{js,cjs}'
            ],
            'parserOptions': {
                'sourceType': 'script'
            }
        }
    ],
    'parserOptions': {
        'ecmaVersion': 'latest',
        'sourceType': 'module'
    },
    'rules': {
        'comma-dangle': ['error', 'never'],
        'import/no-unresolved': 0,
        'indent': ['error', 4, {'SwitchCase': 1}],
        'linebreak-style': ['error', 'unix'],
        'max-len': ['error', {'code': 120}],
        'new-cap': 0,
        'quotes': ['error', 'single', {'allowTemplateLiterals': true}],
        'require-jsdoc': 0,
        'semi': ['error', 'always'],
        'space-before-function-paren': ['error', 'never'],
        'keyword-spacing': ['error', {after: false, overrides: {
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
    },
    'globals': {
        L: 'readonly',
        document: 'readonly',
        module: 'readonly',
        window: 'readonly'
    }
};
