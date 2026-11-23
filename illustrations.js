// The illustrations live in a public Drive folder, which a browser cannot list, so their file
// ids are kept here. Regenerate this map when files are added to or renamed in the folder.
const DRIVE = 'https://lh3.googleusercontent.com/d/';

const IDS = {
    '21.png': '1-4n_Gev_85B6HHjN1YfsK1boXTidlYyY',
    '24 1of3 table.png': '1AgpONGrXt6NqroP8ZLOSGim4a9Ell2Oj',
    '3.png': '1TnasYXIIYFVuiY0gqTBTRdtKOdIFKy9Z',
    '35.png': '1F3mDO_xg9qr8xKtTTw0veu7THUhMzgf8',
    '44 1of3.png': '1dusfdedaFJNDZeG8jsYuhfwdTfsDupmv',
    '44 2of3.png': '1iT0Q9DLWLo5lAQR0iHSh9CBKJTwACWHg',
    '44 3of3.png': '1JTb7AFQ5X-HAm1uMAM7m752wb6_ymJvd',
    '4a.png': '1unfifjPw30wYJc5b5WiGUDrCmSn50my0',
    '4b.png': '1rNrbJJxy_dTt7LrhEqu13AfxMyCK46ZL',
    '4c.png': '1FIXntYhoi64ydke_-FzLSvKW4go7NO3V',
    '5.png': '1IxOfa4FdK7kxOswtpuhgzqUE72q6-2EX',
    '58.png': '1jNqzXrz_Ya6RJOClOE-up7KZgtuXmQO2',
    '59_2.png': '1cnz-OuCN8NJJtPrnb8-GOpCjpDqOXSse',
    '6.png': '1WrpA76wR2CEuB6eux-kU1LLlbiYKJbPw',
    '60.png': '10Ql_lAAL0c8Mv8cqfuoVcSM8-7q11d7G',
    '61.png': '17VvlOBCJ85oCugSqloxszMB2BVEXqKHe',
    '62.png': '1lb_V_jkCIB5bYipTZVqQk_X_QSqrQ1hk',
    '64.png': '1SrctUBiWnXQjykWLFBEr6udBnw5EWTrR'
};

export const ILLUSTRATIONS = Object.fromEntries(
    Object.entries(IDS).map(([name, id]) => [name, `${DRIVE}${id}`])
);
