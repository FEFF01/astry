
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

const TEST_KEYWORD_BOUNDARY = [
    [NO_CAPTURE, ["", " ", "\n", `\t`, ",", "(", ")", "{", "}", ":", "[", "]"]]
];
const THROW_TOKEN_ERROR = hook(function (env, start, end) {
    console.log("Invalid or unexpected token", start, end);
}, HOOK_MODE.RESOLVE);

const LITERAL_VALUE_MAP = { true: true, false: false, null: null };
const COLLECT_STRING = [
    [
        pick(function (tokens, env, start, end) {
            return [env.input.slice(start.offset, end.offset), tokens[1].value];
        }),
        `"`,
        hook(function (env) {
            env.useEscape = true;
        }, HOOK_MODE.CAPTURE),
        WRAP,
        [
            [THROW_TOKEN_ERROR, "\n"],
            [
                `"`,
                hook(function (env) {
                    env.useEscape = false;
                }, HOOK_MODE.CAPTURE),
                UNWRAP,
            ]
        ]
    ]
];


const MATCH_WHITE_SPACE_CHARACHER = [` `, `\n`, `\t`];

const CLEAR_WHITE_SPACE_CHARACHER = [
    [NO_COLLECT, MATCH_WHITE_SPACE_CHARACHER]
];

const Literal = node("Literal").Wrapper;

const PARSE_NUMBER_LITERAL = pipe(
    function (token: Token, env, start, end) {
        let value: any = token.value;
        const result: any = /^(-?[1-9][0-9]*|0)(.[0-9]+)?([eE][-+]?[0-9]+)?$/g.exec(value);
        if (result) {
            const [, int, frac, exp] = result;
            value = int | 0;
            frac && (value += frac % 1);
            exp && (value *= Math.pow(10, exp.slice(1) | 0));
        } else {
            debugger;
        }
        return Object.assign(   //  Number(value)
            new Literal(),
            { raw: token.value, value: value, loc: { start, end } }
        );
    } ,
);


export default <IPattern>[
    [PARSE_NUMBER_LITERAL, CLEAR_WHITE_SPACE_CHARACHER],
    [
        node("Literal", function ([[raw, value]]: any) {
            return [
                useKey("raw", raw),
                useKey("value", value)
            ];
        }),
        [
            [COLLECT_STRING],
            [
                pick(function ({ value }: Token) {
                    return [value, LITERAL_VALUE_MAP[value]]
                }),
                "",
                ["true", "false", "null"]
                , TEST_KEYWORD_BOUNDARY
            ]
        ]
    ],
    [
        node("Object", function ([tokens]: [Array<any>]) {
            return useKey("children", tokens.filter(
                function (token) {
                    if (token instanceof Token) {
                        debugger;
                        return false;
                    }
                    return true;
                }
            ));
        }),
        NO_COLLECT, "{", WRAP,
        [
            [NO_COLLECT, "}", UNWRAP],
            [CLEAR_WHITE_SPACE_CHARACHER],
            [
                node("Identifier", function ([[raw, value]]: any) {
                    return [
                        useKey("value", value),
                        useKey("raw", raw)
                    ]
                }),
                COLLECT_STRING,
                node("Property", function ([key, [value]]) {
                    const props = [useKey("key", key)];
                    if (value.length === 1 && !(value[0] instanceof Token)) {
                        props.push(useKey("value", value[0]));
                    } else {
                        debugger;
                    }
                    return props;
                }),
                prev(),
                WRAP,
                [
                    [CLEAR_WHITE_SPACE_CHARACHER],
                    [
                        NO_COLLECT, ":", WRAP,
                        FORK_IN_ROOT,
                        PARSE_NUMBER_LITERAL,
                        [
                            [NO_CAPTURE, "}", UNWRAP, UNWRAP],
                            [NO_COLLECT, ",", UNWRAP, UNWRAP],
                        ]
                    ]
                ]
            ]
        ]
    ],
    [
        node("Array", function ([tokens]: [Array<any>]) {
            const children = [];
            for (let i = 0, len = tokens.length; i < len; i += 2) {
                let value = tokens[i];
                let spearator = tokens[i + 1];
                if (!spearator || (spearator.value === "," && i < len - 2)) {
                    if (!(value instanceof Token)) {
                        children.push(value);
                        continue;
                    }
                }
                debugger;
                break;
            }
            return useKey("children", children);
        }),
        NO_COLLECT, "[", WRAP,
        FORK_IN_ROOT,
        PARSE_NUMBER_LITERAL,
        [
            [NO_COLLECT, "]", UNWRAP],
            [","]
        ]
    ]
];


