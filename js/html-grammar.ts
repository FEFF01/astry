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
    MERGE_ALL_TOKENS
} = OPERATIONS;

import CSSGrammar from "./css-grammar";


const SELF_CLOSING_TAGS = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
    "command",
    "keygen",
    "menuitem"
];

const MATCH_WHITE_SPACE_CHARACHER: IPattern = [` `, `\n`, `\t`];
const CLEAR_WHITE_SPACE_CHARACHER: IPattern = [
    [NO_COLLECT, MATCH_WHITE_SPACE_CHARACHER]
];

const MATCH_ATTRIBUTES: IPattern = [
    [CLEAR_WHITE_SPACE_CHARACHER],
    ["="],
    [`"`, WRAP, `"`, UNWRAP],
    [`'`, WRAP, `'`, UNWRAP],
];




const MATCH_TAG_END: IPattern = [
    [
        hook(function ({ tokens }) {
            if (tokens[0][2].value !== tokens[tokens.length - 1][1].value) {
                return -2;
            }
        }, HOOK_MODE.RESOLVE),
        "</", WRAP,
        [
            [MATCH_WHITE_SPACE_CHARACHER],
            [">", UNWRAP_ALL]
        ]

    ]
];


const THROW_TOKEN_ERROR = hook(function (env, start, end) {
    console.log("Invalid or unexpected token", start, end);
}, HOOK_MODE.RESOLVE);

const MATCH_SCRIPT_TEXT: IPattern = [
    [
        `"`, WRAP,
        [
            [THROW_TOKEN_ERROR, `\n`],
            [`"`, UNWRAP]
        ]

    ],
    [
        `'`, WRAP,
        [
            [THROW_TOKEN_ERROR, `\n`],
            [`'`, UNWRAP]
        ]

    ],
    ["//", WRAP, ["\n", [OPERATIONS.MATCH_EOF]], UNWRAP],
    ["/*", WRAP, ["*/", [OPERATIONS.MATCH_EOF]], UNWRAP],
    [
        MARK_AS_ROOT,
        `\``, WRAP,
        [
            [
                `$`,
                `{`, WRAP,
                FORK_IN_ROOT,
                `}`, UNWRAP
            ],
            [`\``, UNWRAP]
        ]
    ],
];

const MATCH_SCRIPT_END: IPattern = [
    [
        hook(function (env) {
            env.useEscape = true;
            env.ignoreCase = false;
        }, HOOK_MODE.CAPTURE/*HOOK_MODE.LEFT_ASSOCIATIVE*/),
        MATCH_SCRIPT_TEXT
    ],
    [
        hook(function (env) {
            env.useEscape = false;
            env.ignoreCase = true;
        }, HOOK_MODE.RESOLVE),
        MATCH_TAG_END,
    ]
];

const CSSScanner = new Scanner(
    [
        [CSSGrammar],
        [
            hook(function (env) {
                env.end = env.offset;
            }, HOOK_MODE.RESOLVE),
            MATCH_TAG_END
        ]
    ],
    { useEscape: true }
);

const MATCH_STYLE_END: IPattern = [

    [// 使用内联 JS 编译
        hook(function (env) {
            const end = env.end;
            env.useEscape = true;
            env.ignoreCase = false;

            CSSScanner.scan(env);

            env.end = end;
        }, HOOK_MODE.CAPTURE),

        hook(function (env) {
            env.useEscape = false;
            env.ignoreCase = true;
        }, HOOK_MODE.RESOLVE),
        "", UNWRAP_ALL,
    ]

    /*
    // 内联整个 CSS Pattern 编译消耗很大
    [MARK_AS_ROOT, CSSGrammar],
    [
        hook(function (env) {
            env.useEscape = true;
            env.ignoreCase = false;
        }, HOOK_MODE.CAPTURE),
        hook(function (env) {
            env.useEscape = false;
            env.ignoreCase = true;
        }, HOOK_MODE.RESOLVE),
        MATCH_TAG_END,
    ]
    */
];

const TextNode = node("Text").Wrapper;


export {
    formatTokens,
    SELF_CLOSING_TAGS
};
export default <IPattern>[
    [
        node("DocumentType"),
        pick(function (tokens: Array<any>) {
            tokens[1] = useKey("name", tokens[1].value);
            return tokens;
        }),
        "<!doctype", WRAP,
        [
            [CLEAR_WHITE_SPACE_CHARACHER],
            [">", UNWRAP]
        ],
    ],
    [
        node("Comment"),
        key("data", function (tokens) {
            return tokens[1].value;
        }),
        "<!--", WRAP, "-->", UNWRAP
    ],
    [
        MARK_AS_ROOT,
        node("HTMLElement"),
        pick(collectChildNodes),
        pick(collectAttrs),
        pick(collectTagName),
        "<", WRAP,
        [
            [MATCH_ATTRIBUTES],
            ["/>", UNWRAP],
            [
                ">", WRAP,
                [
                    [FORK_IN_ROOT],
                    [MATCH_TAG_END]
                ]
            ]
        ],
    ],
    matchCustomTag("script", MATCH_SCRIPT_END),
    matchCustomTag("style", MATCH_STYLE_END),
    matchCustomTag("textarea", MATCH_TAG_END),
    matchSelfClosingTag(SELF_CLOSING_TAGS),
]







function matchSelfClosingTag(tagName: IPattern) {
    return [
        node("HTMLElement"),
        pick(collectChildNodes),
        pick(collectAttrs),
        pick(collectTagName),
        "<", SPLIT,
        tagName,
        SPLIT,
        [
            [
                ["/>", ">"],
                hook(function (env) {//使折叠次数一致
                    const { tokens, hookPoint } = env;
                    tokens.push(tokens.splice(hookPoint));
                }, HOOK_MODE.RESOLVE),
                FINISH,
            ],
            [
                NO_COLLECT, [" ", "\n"],
                WRAP,
                [
                    [MATCH_ATTRIBUTES],
                    [
                        ["/>", ">"],
                        UNWRAP
                    ]
                ]
            ]
        ]
    ];

}
function matchCustomTag(tagName: IPattern, tagEnd: IPattern) {
    return [
        node("HTMLElement"),
        pick(collectChildNodes),
        pick(collectAttrs),
        pick(collectTagName),
        "<", SPLIT,
        tagName,
        SPLIT,
        [
            [
                "/>",
                hook(function (env) {//使折叠次数一致
                    const { tokens, hookPoint } = env;
                    tokens.push(tokens.splice(hookPoint));
                }, HOOK_MODE.RESOLVE),
                FINISH
            ],
            [
                WRAP, ">",
                WRAP, //保持折叠次数，统一使用同一个 hook 逻辑处理
                tagEnd
            ],
            [
                NO_COLLECT, [" ", "\n"],
                WRAP,
                [
                    ["/>", UNWRAP_ALL],
                    [MATCH_ATTRIBUTES],
                    [">", WRAP, tagEnd]
                ]
            ]
        ],
    ]
}


function collectAttrs(tokens: Array<any>) {
    const attrs = [];

    for (let i = 1; i < tokens.length - 1; i += 1) {
        let key = getValue(tokens[i]);
        let value = "";
        if (getValue(tokens[i + 1]) === "=") {
            value = getValue(tokens[i += 2]);
        }
        attrs.push({ key, value });
    }
    tokens.splice(1, tokens.length - 2, useKey("attrs", attrs));
    return tokens;

    function getValue(token: any) {
        if (token instanceof Token) {
            return token.value;
        } else if (token instanceof Array) {
            return token.map(getValue);
        }
        return token;
    }
}

function formatTokens(tokens: Array<any>) {
    const result = [];

    let textNode: any, textToken: Token;
    walk(tokens);

    return result;

    function walk(token: any) {
        if (token instanceof Array) {
            token.forEach(walk);
        } else {
            if (token instanceof Token) {
                if (textToken) {
                    textToken = textToken.concat(token);
                } else {
                    textToken = token;
                    textNode = new TextNode();
                    result.push(textNode);
                }
                textNode.data = textToken.value;
                textNode.loc = textToken.loc;
                return;
            }
            textNode = textToken = null;
            result.push(token);
        }
    }
}

function collectChildNodes(tokens: Array<any>) {
    const nodes = tokens.pop();
    tokens.push(
        useKey(
            "childNodes",
            nodes instanceof Array
                ? formatTokens(nodes.slice(1, -1))
                : []
        )
    );
    return tokens;
}

function collectTagName(tokens: Array<any>) {
    tokens.splice(0, 2, useKey("tagName", tokens[1].value.toUpperCase()))
    return tokens;
}
