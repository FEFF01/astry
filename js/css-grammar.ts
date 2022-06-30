import {
    Scanner, OPERATIONS, HOOK_MODE, IScanEnv,
    IPattern, Token,
    IPosition, ISourceLocation,
} from "./scanner"


const {
    FINISH,
    WRAP, UNWRAP, UNWRAP_ALL,
    OPTION,
    SPLIT,
    NO_COLLECT, NO_CAPTURE,
    MARK_AS_ROOT, FORK_IN_PARENT, FORK_IN_ROOT,
    END, END_ON_LEFT,
    useKey,
    node, key, pick, hook, pipe, prev, merge,

    MATCH_BEGIN,
    MATCH_END,
    MATCH_EOF,
    MERGE_ALL_TOKENS,
    UNFOLD
} = OPERATIONS;



const MATCH_WHITE_SPACE_CHARACHER: IPattern = [` `, `\n`, `\t`];
const CLEAR_COMMENT: IPattern = [
    [
        NO_COLLECT,
        [
            ["//", WRAP, ["\n", [MATCH_EOF]], UNWRAP],
            ["/*", WRAP, ["*/", [MATCH_EOF]], UNWRAP],
        ],
    ]
]

const CLEAR_WHITE_SPACE_CHARACHER: IPattern = [
    [NO_COLLECT, MATCH_WHITE_SPACE_CHARACHER]
];


const TEST_KEYWORD_BOUNDARY: IPattern = [
    [NO_CAPTURE, [" ", "\n", `\t`, "(", ")", "{", "}", ":"]]
];

const NODE_LIST = function (tokens: Array<any>) {
    return tokens.filter(token => !(token instanceof Token));
}
const Declaration = node("Declaration").Wrapper;

const THROW_TOKEN_ERROR = hook(function (env, start, end) {
    console.log("Invalid or unexpected token", start, end);
}, HOOK_MODE.RESOLVE);

const MATCH_STRING: IPattern = [
    [
        `"`, WRAP,
        [
            [THROW_TOKEN_ERROR, `\n`],
            [`\\`, [`\\`, `\n`, `"`]],
            [`"`, UNWRAP]
        ]

    ],
    [
        `'`, WRAP,
        [
            [THROW_TOKEN_ERROR, `\n`],
            [`\\`, [`\\`, `\n`, `'`]],
            [`'`, UNWRAP]
        ]
    ],
]

// 不包含 '' "" 的 url 地址可能会包含断义字符 / 影响判别，这里通过单独匹配给出结果
const MATCH_URL: IPattern = [
    [
        MATCH_BEGIN, "url(", WRAP,
        [
            [MATCH_STRING],
            [CLEAR_WHITE_SPACE_CHARACHER],
            [")", UNWRAP]
        ],
    ]
];

const MATCH_CSS_ATTRIBUTE_VALUE: IPattern = [
    [
        MARK_AS_ROOT,
        [
            [MATCH_STRING],
            [MATCH_URL],
            [
                // 使能在 ( 后被断句
                // 这里没做额外检验允许括号前的空格
                MERGE_ALL_TOKENS,
                prev(null, true), "("
            ],
            ")",
            [CLEAR_WHITE_SPACE_CHARACHER],
            [CLEAR_COMMENT],
            [
                MERGE_ALL_TOKENS,
                prev(null, true),
                "%"
            ],
            "/",
            ","
        ]
    ]
]
const MATCH_CSS_ATTRIBUTE: IPattern = [
    [CLEAR_COMMENT],
    [CLEAR_WHITE_SPACE_CHARACHER],
    [   //通用样式匹配
        merge(function ([key, value]) {
            return useKey(key, value);
        }),
        prev(function (token: any) {
            if (token instanceof Token) {
                return true;
            }
            debugger;
        }),
        NO_COLLECT, ":", WRAP,
        [
            [MATCH_CSS_ATTRIBUTE_VALUE],
            ["!important", NO_CAPTURE, [MATCH_END, " ", "\n", "}", ";"]],
            [NO_CAPTURE, "}", UNWRAP],
            [NO_COLLECT, ";", UNWRAP],
            [MATCH_EOF, UNWRAP]
        ]
    ]
]

const CSSStyleRule = [
    node("CSSStyleRule"),
    key("selectorText", function (token: Token) { return token.trim() }),
    prev(function (token: any) {
        if (token instanceof Token) {
            return true;
        }
        debugger;
        // error
    }),
    key("style"),
    node(
        "CSSStyleDeclaration",
        /*function ([token]: [Array<any>], env: ScanEnv, start: Position, end: Position) {
            token.push(
                useKey("cssText", env.input.slice(start.offset + 1, end.offset - 1))
            )
        }*/
        undefined, true
    ),
    "{", WRAP,
    [
        ["}", UNWRAP],
        [MATCH_CSS_ATTRIBUTE]
    ],
];
const CSSMediaRule = [
    MARK_AS_ROOT,
    node("CSSMediaRule"),
    "@media", TEST_KEYWORD_BOUNDARY, WRAP,
    key("media"),
    prev(function (token: Token) {
        const value = token.value;
        return value.length - value.match(/\S|$/).index;
    }, true),
    key("cssRules", NODE_LIST),
    "{", WRAP,
    FORK_IN_ROOT,
    "}", UNWRAP_ALL
];
const CSSKeyframesRule = [
    node("CSSKeyframesRule"),
    "@keyframes", TEST_KEYWORD_BOUNDARY, WRAP,
    key("name"),
    prev(function (token: any) {
        if (token instanceof Token) {
            return true;
        }
        debugger;
    }),
    key("cssRules", NODE_LIST),
    "{", WRAP,
    [
        ["}", UNWRAP_ALL],
        [
            node("CSSKeyframeRule"),
            "{", WRAP,
            [
                ["}", UNWRAP],
                [MATCH_CSS_ATTRIBUTE]
            ]
        ]
    ]
];
const CSSFontFaceRule = [
    node("CSSFontFaceRule"),
    "@font-face", TEST_KEYWORD_BOUNDARY, WRAP,
    "{", WRAP,
    [
        ["}", UNWRAP_ALL],
        [MATCH_CSS_ATTRIBUTE]
    ]
];
const CSSSupportsRule = [
    MARK_AS_ROOT,
    node("CSSSupportsRule"),
    pick(function (tokens: Array<any>) {
        return [
            useKey("conditionText", tokens[1].value.trim()),
            useKey("cssRules", NODE_LIST(tokens[2]))
        ];
    }),
    "@supports", TEST_KEYWORD_BOUNDARY, WRAP,
    "{", WRAP,
    FORK_IN_ROOT,
    "}", UNWRAP_ALL
];

export {
    MATCH_CSS_ATTRIBUTE_VALUE,
    MATCH_CSS_ATTRIBUTE
}
export default <IPattern>[
    [CLEAR_COMMENT],
    [NO_COLLECT, [["", MATCH_WHITE_SPACE_CHARACHER]]],
    CSSSupportsRule,
    CSSStyleRule,
    CSSMediaRule,
    CSSKeyframesRule,
    CSSFontFaceRule
];
