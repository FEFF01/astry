// \@ts-nocheck

import { Scanner, OPERATIONS } from "./scanner"

import CSSGrammar from "./css-grammar";

import HTMLGrammar from "./html-grammar";

import JSONGrammar from "./json-grammar";


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

global.Scanner = Scanner;


const cssScanner = global.cssScanner = new Scanner(CSSGrammar, { useEscape: true });

true && console.log(
    "css",
    cssScanner.scan(global.css_text = `

@media screen and (min-width: 480px) {
    body {
        background:   lightgreen reply
    }
}

#main {
    border: 1px solid black;
}

ul li {
	padding: 5px;
}

@font-face {
    src: url('~@/static/iconfont.ttf');
}

@font-face {
    font-family:  MyHelvetica  !important;
    src: local("Helvetica Neue Bold"),
    local("HelveticaNeue-Bold"),
    url(MgOpenModernaBold.ttf);
    font-weight: bold
}
@keyframes test{
    from, 50%{
        transform:translate(50%,0);
    }
    to{
        transform:translate(100px,0);
    }
}
@media only screen and (min-width: 320px) and (max-width: 480px) and (resolution: 150dpi) {
    body {
        line-height: 1.4
    }
}

`)
);



const htmlScanner = global.htmlScanner = new Scanner(HTMLGrammar, { useEscape: false, useFold: true, ignoreCase: true });

// production 版本注释区的有用文本会被去除
true && console.log(
    "html",
    htmlScanner.scan(
        global.html_text = (function () {
            /*
    <!DOCTYPE html>
    <html>
      <head>
        <title>test</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
        @media screen and (min-width: 480px) {
        body {
            background:   lightgreen reply
        }
    }
    #main {
        border: 1px solid black;
    }
    
    ul li {
        padding: 5px;
    }
        \</style>
        </span>
        </style>
      </head>
    <body>
        <script/>
        <script>s\"d"43<span>5" `sd${sdfsf"</script>"}` ff </text>f//</span>
        </script>
        <script id="test">sd"43<span>5"f//</sciprt>
        </script>
        <span id="ss">s
        <input  id="test"/>
        <span></span>
        s</span>
        <textarea id="test"><span></span><span></textarea >
        <!--<span>-->
        <span>sdfd</test></test2></span>
        <span/>
        <span alt="test" sss eee/>sdfdsf
        <span title = "test">test</span>
        <input>
        </text>
        <input/>
        <input  placeholder="test">
        <h1>My First Heading</h1>
        <p>My first paragraph.</p>
    </body>
    </html>
            */
        }).toString().replace(/(^[\s\S]*?\/\*)|(\*\/[\s\S]*?$)/g, "")
    )
);


const jsonScanner = global.jsonScanner = new Scanner(JSONGrammar);
true && console.log(
    "json",
    jsonScanner.scan(global.json_text = `
{
    "key1": [  true, false, null] ,
    "key2"  : {
        "key3"  : [1, 2, "3\
        " , 13.33e-10 , 1e-3]
    },
    "KEY3":334
}
`)
);


const test = new Scanner([
    [
        [
            "||",
            "|",
        ],
        NO_COLLECT,
        OPTION,
        [
            [
                [` `, `\t`, `\n`],
                OPTION,
                [
                    [
                        [` `, `\t`, `\n`],
                        FORK_IN_PARENT
                    ]
                ]
            ]
        ]

    ]
], { useEscape: true });

console.log(test.scan("|| |  |||||").tokens);

