(()=>{"use strict";var __webpack_modules__={439:(__unused_webpack_module,exports)=>{Object.defineProperty(exports,"__esModule",{value:!0}),exports.unwrapTokens=exports.UseKey=exports.Token=exports.OPERATIONS=exports.Scanner=void 0;class Hook{constructor(){this.mode=1}}class Node extends Hook{constructor(type,map,useContent){super(),this.type=type,this.map=map,this.useContent=useContent,this.Wrapper=Node.NODE_MAP[type]||(Node.NODE_MAP[type]=eval(`(function ${type}(){this.type="${type}";})`))}use(e,t,n){let{tokens:o,hookPoint:s}=e;const i=new this.Wrapper;i.loc={start:t,end:n};let r=function(e){i[e.key]=e.value};if(this.useContent){const e=i.content=[];r=function(t){e.push(t)}}o=o.splice(s),this.map&&(o=this.map(o,e,t,n)||o),function e(t){t instanceof Array?t.forEach(e):t instanceof UseKey&&r(t)}(o),e.tokens.push(i)}}Node.NODE_MAP={};class UseKey{constructor(e,t){this.key=e,this.value=t}}exports.UseKey=UseKey;class Key extends Hook{constructor(e,t){super(),this.key=e,this.map=t}use(e,t,n){let{tokens:o,hookPoint:s}=e,i=o[s];this.map&&(i=this.map(i,e,t,n)||i),o.splice(s,1,new UseKey(this.key,i))}}Key.Wrapper=UseKey;class Merge extends Hook{constructor(e){super(),this.map=e}use(e,t,n){let{tokens:o,hookPoint:s}=e;o.push(this.map(o.splice(s),e,t,n))}}class Prev extends Hook{constructor(e,t){super(),this.match=e,this.onlyToken=t}use(e){let{tokens:t,hookPoint:n}=e;n-=1;let o=t[n];if(!this.onlyToken||o instanceof Token){if(this.match){let s=this.match(o,e);if(s&&"number"==typeof s&&s!==o.value.length)return void t.splice(n,1,o.slice(0,-s),o.slice(-s))}e.hookPoint-=1}}}class Pipe extends Hook{constructor(e){super(),this.pipe=e,this.mode=4}use(e,t,n){let{tokens:o,hookPoint:s}=e,i=this.pipe(o[s],e,t,n);void 0!==i?o[s]=i:o.splice(s,1)}}class Pick extends Pipe{constructor(){super(...arguments),this.mode=1}}class Call extends Hook{constructor(e,t){super(),this.use=e,this.mode=t}}class NoCapture extends Hook{constructor(){super(),this.mode=2}use(e,t,n){let{tokens:o,hookPoint:s}=e;o.splice(s,1),t.offset<e.offset&&(e.offset=t.offset,e.line=t.line,e.column=t.column)}}var OPERATIONS,MARKS,SCOPE;!function(e){e.FINISH=new String("FINISH"),e.WRAP=new String("WRAP"),e.UNWRAP=new String("UNWRAP"),e.UNWRAP_ALL=new String("UNWRAP_ALL"),e.OPTION=new String("OPTION"),e.SPLIT=new String("SPLIT"),e.NO_COLLECT=new String("NO_COLLECT"),e.NO_CAPTURE=new String("NO_CAPTURE"),e.MARK_AS_ROOT=new String("MARK_AS_ROOT"),e.FORK_IN_PARENT=new String("FORK_IN_PARENT"),e.FORK_IN_ROOT=new String("FORK_IN_ROOT"),e.END=new String("END"),e.END_ON_LEFT=new String("END_ON_LEFT"),e.useKey=function(e,t){return new UseKey(e.toString(),t)},e.node=function(e,t,n=!1,o=1){const s=new Node(e,t,n);return s.mode=o,s},e.key=function(e,t){return new Key(e,t)},e.pick=function(e){return new Pick(e||function(){})},e.hook=function(e,t=1){return new Call(e,t)},e.pipe=function(e){return new Pipe(e||function(){})},e.prev=function(e,t){return new Prev(e,t)},e.merge=function(e=function(e){return e}){return new Merge(e)},e.MATCH_BEGIN="",e.MATCH_END="",e.MATCH_EOF=[["",""]],e.MERGE_ALL_TOKENS=e.merge((function(e){return e.reduce(((e,t)=>e.concat(t)))})),e.UNFOLD=e.hook((function(e){const{tokens:t,hookPoint:n}=e;for(const e of t.splice(n))e instanceof Array?t.push(...e):t.push(e)}),1)}(OPERATIONS||(OPERATIONS={})),exports.OPERATIONS=OPERATIONS,function(e){e.FINISH=OPERATIONS.FINISH,e.END=OPERATIONS.END,e.END_ON_LEFT=OPERATIONS.END_ON_LEFT,e.UNWRAP=OPERATIONS.UNWRAP,e.WRAP=OPERATIONS.WRAP,e.ROOT=new String("ROOT"),e.RESOLVE="_RESOLVE_",e.TYPE="_TYPE_",e.ROLL="_ROLL_",e.PARENT="_PARENT_",e.COLLECT="_COLLECT_",e.BUBBING_HOOKS="_BUBBING_HOOKS_",e.CAPTURING_HOOKS="_CAPTURING_HOOKS_",e.SLICE_HOOKS="_SLICE_HOOKS_",e.IGNORE_TESTS="_IGNORE_TESTS_",e.RESOLVE_TYPE_SET=new Set([OPERATIONS.FINISH,OPERATIONS.END,OPERATIONS.END_ON_LEFT,OPERATIONS.UNWRAP,OPERATIONS.UNWRAP_ALL,OPERATIONS.WRAP,e.ROOT])}(MARKS||(MARKS={})),function(e){e[e.NODE=0]="NODE",e[e.START=1]="START",e[e.CURSOR=2]="CURSOR",e[e.BACK_POINT=3]="BACK_POINT",e[e.USE_FOLD=4]="USE_FOLD"}(SCOPE||(SCOPE={}));class Scanner{constructor(e,t){this.useEscape=!1,this.useFold=!0,this.ignoreCase=!1,this.scanTree=build(e),t&&Object.assign(this,t)}scan(e){let t,n,o="string"==typeof e?{tokens:[],input:e,begin:0,offset:0,end:e.length,line:1,column:1,useFold:this.useFold,useEscape:this.useEscape,ignoreCase:this.ignoreCase,hookPoint:0}:e,s=[],i=[[this.scanTree,u(),u(),0,!1]],r=0,c=!0;for(;;){let e;if(r||(n=u()),c)e="",c=!1;else{if(o.offset>=o.end){if(i[0][SCOPE.CURSOR].offset<n.offset){if(l("")||O())return o;if(o.offset<o.end)break;s.length=0,l("")}if(s.length){const e=t;if(l("",!0),e!==t&&O())return o}i[0][SCOPE.CURSOR].offset<n.offset&&f(i[0][SCOPE.CURSOR],n,null);break}switch(e=o.input[o.offset],o.offset+=1,e){case"\r":if("\n"!==o.input[o.offset])break;e="\n",o.offset+=1;case"\n":o.line+=1,o.column=0}if(o.column+=1,o.ignoreCase&&(e=e.toLowerCase()),o.useEscape)if("\\"===e){if(r^=1,r)continue}else r&&(r=0,e="\\"+e)}if(l(e))return o}return o;function u(){return{offset:o.offset,line:o.line,column:o.column}}function l(e,o){const r=s;let c,l,_;for(s=[];;){if(r.length)[c,l]=r.shift();else{if(t||c===i[0][SCOPE.NODE])break;c=i[0][SCOPE.NODE],l=null}_=!1,t=S(c,l)||c[MARKS.ROLL]&&S(c[MARKS.ROLL],l)||t}if(!o&&0===s.length&&O())return!0;function S(t,o){let r=t[e];if(r&&(o?_&&(o=o.slice()):o=[[n,t[MARKS.CAPTURING_HOOKS]]],_=!0,s.push([r,o]),r[MARKS.CAPTURING_HOOKS]&&o.push([u(),r[MARKS.CAPTURING_HOOKS]]),r[MARKS.RESOLVE]))return r=r[MARKS.RESOLVE],[r,u(),o,i.length]}}function O(){if(!t)return;const[e,{offset:n,line:s,column:r},u,l]=t;i.splice(0,i.length-l),o.offset=n,o.line=s,o.column=r;let O=_(e,u,!0);if(O>0)return!0;if(O<0)do{const e=i.shift();let t=o.tokens;e[SCOPE.USE_FOLD]?(o.tokens=t.shift()).pop():t.length=e[SCOPE.BACK_POINT]}while(++O<0);t=null,c=!0}function _(e,t,n){let s=e[MARKS.TYPE];const r=i[0],c=t[0][0];let l=o.tokens.length;if(n){let n,o=e[MARKS.SLICE_HOOKS];o&&(n=t[0][1],n&&(n=n.filter((e=>o.has(e))))),f(r[SCOPE.CURSOR],c,n)}if(s===MARKS.WRAP)return function(e,t,n){const{useFold:s,tokens:r}=o,c=r.length;let l=t[0][0];i.unshift([e,l,u(),c,s]),s&&(o.tokens=[r],o.hookPoint=1);let O=n?R(t,e[MARKS.SLICE_HOOKS]):0;return O>=0&&(O=S(e[MARKS.BUBBING_HOOKS],l,u()),O>=0)&&(e=e[MARKS.RESOLVE])?_(e,t,!1):O}(e,t,n);const O=o.tokens.length;if(n&&s!==MARKS.END_ON_LEFT){let n=R(t,e[MARKS.SLICE_HOOKS]);if(n<0)return o.tokens.length=l,n+1}if(o.hookPoint=O,s===MARKS.UNWRAP)return function(e,t){const n=i.shift();if(n[SCOPE.USE_FOLD]){let e=o.tokens.shift();o.hookPoint=e.length,e.push(o.tokens),o.tokens=e}let s=S(e[MARKS.BUBBING_HOOKS],n[SCOPE.START],u());if(s>=0){if(e=e[MARKS.RESOLVE],i[0][SCOPE.CURSOR]=u(),!e)return s;if(s=_(e,t,!1),s>=0)return s}if(i.unshift(n),n[SCOPE.USE_FOLD]){let e=o.tokens.pop();e.unshift(o.tokens),o.tokens=e}return s+1}(e,t);{let t=S(e[MARKS.BUBBING_HOOKS],c,u());return t<0?(o.tokens.length=l,t+1):s===MARKS.END_ON_LEFT?(o.offset=c.offset,o.line=c.line,o.column=c.column,r[SCOPE.CURSOR]=c,1):(r[SCOPE.CURSOR]=u(),s!==MARKS.END?t:1)}}function S(e,t,n){for(const s of e){let e=s.use(o,t,n);if(e<0)return e}return 0}function f(e,t,n){let s=0;if(e.offset<t.offset){let{tokens:i}=o;o.hookPoint=i.length,i.push(new Token(o.input.slice(e.offset,t.offset),e,t)),n&&(s=S(n,e,t))}return s}function R(e,t){let n=e[0][0];if(t)for(let o=1;o<e.length;o+=1){let[s,i]=e[o];if(i=i.filter((e=>t.has(e))),i.length){const e=f(n,s,i);if(e<0)return e;n=s}}return f(n,u(),null)}}}exports.Scanner=Scanner;class Token{constructor(e,t,n){this.value=e,this.loc={start:t,end:n}}trim(){const e=this.value.match(/^\s*|\s*$/gm);return this.slice(e[0].length,this.value.length-e[1].length)}concat(e){return new Token(this.value+e.value,this.loc.start,e.loc.end)}slice(e,t=this.value.length){let{value:n,loc:{start:o,end:s}}=this,{offset:i,line:r,column:c}=o,u=0;t<0&&(t=n.length+t),e<0&&(e=n.length+e),e>t&&(t=e);const l=[e,t].map((function(e){if(0===e)return o;if(e===n.length)return s;for(;u<e;)"\n"===n[u]?(r+=1,c=1):c+=1,u+=1;return{offset:i+e,line:r,column:c}}));return new Token(n.slice(e,t),l[0],l[1])}toString(){return this.value}}exports.Token=Token;class RootStack extends Array{}function build(e){const t={[MARKS.TYPE]:MARKS.ROOT},[n,o,s]=buildRule([e],[t],[[new RootStack]],[[]],[t]);for(let e=0;e<n.length;e+=1){const t=n[e];MARKS.RESOLVE_TYPE_SET.has(t[MARKS.TYPE])||buildKey(MARKS.FINISH,[t],[o[e]],[s[e]])}return t}function buildRule(e,t,n,o,s){const i=[];let r,c=0;for(;c<e.length;){let O=0,_=c;const S=[];for(;;){if(e[c]===OPERATIONS.FORK_IN_ROOT)O&&(S.push(O),O=0),S.push(OPERATIONS.FORK_IN_ROOT);else{if(e[c]!==OPERATIONS.FORK_IN_PARENT)break;O+=1}c+=1}if(c===_){switch(r=e[c]){case OPERATIONS.NO_CAPTURE:case OPERATIONS.NO_COLLECT:i.push(r);case OPERATIONS.SPLIT:l(null);break;case OPERATIONS.OPTION:return u([i.concat(e.slice(c+1)),i.concat(e.slice(c+2))],(function(e){return buildRule(e,t,n.map((e=>e.slice())),o.map((e=>e.slice())),s)}));case OPERATIONS.MARK_AS_ROOT:return e=i.concat(e.slice(c+1)),u(t,(function(t,i){const r=n[i];return buildRule(e,[t],[[new RootStack(...r[0])].concat(r.slice(1))],[o[i]],[t].concat(s))}));default:if(r instanceof Hook)l(r);else for([t,n,o]=r instanceof Array?u(r,(function(e){return(e instanceof Array?buildRule:buildKey)(e,t,n.map((e=>e.slice())),o.map((e=>e.slice())),s)})):buildKey(r,t,n,o);i.length;)l(i.shift()===OPERATIONS.NO_COLLECT?OPERATIONS.pipe():new NoCapture)}c+=1}else{O&&S.push(O);for(let e of t){let t=e,n=0;for(let e of S)if(e===OPERATIONS.FORK_IN_ROOT)t=s[n++];else do{t=t[MARKS.PARENT],t===s[n]&&(n+=1)}while(--e>=0);e[MARKS.ROLL]!==t&&(e[MARKS.ROLL],e[MARKS.ROLL]=t)}}}return[t,n,o];function u(e,t){let n=[],o=[],s=[];for(let i=0;i<e.length;i+=1){const r=t(e[i],i);n=n.concat(r[0]),o=o.concat(r[1]),s=s.concat(r[2])}return[n,o,s]}function l(e){if(window.test,e)switch(e.mode){case 1:n.forEach((e=>e.push(r)));break;case 4:case 2:for(let e=0;e<t.length;e+=1)s(e)}else{e=new Call((function(){}),2);for(let e=0;e<t.length;e+=1)MARKS.RESOLVE_TYPE_SET.has(t[e][MARKS.TYPE])||s(e)}function s(n){const s=t[n],i=s[MARKS.TYPE];4!==e.mode&&MARKS.RESOLVE_TYPE_SET.has(i)?s[MARKS.BUBBING_HOOKS].push(e):((s[MARKS.CAPTURING_HOOKS]||(s[MARKS.CAPTURING_HOOKS]=[])).push(e),o[n].push(e))}}}function buildKey(e,t,n,o,s){if("string"==typeof e){/^[\s\S]?$/.test(e)&&(e=[e]);for(let n=0;n<e.length;n+=1)t=t.map((function(t){return t[e[n]]||(t[e[n]]={[MARKS.PARENT]:t})}))}else MARKS.RESOLVE_TYPE_SET.has(e)&&(t=t.map((function(t,s){let r=n[s],c=o[s];if(o[s]=[],e===OPERATIONS.UNWRAP_ALL){if(e=OPERATIONS.UNWRAP,!(r[0]instanceof RootStack)){r.length>1&&(r[0]=r[0].concat(r.slice(1)));do{n[s]=[r[0][0]],r=r[0],t=i(t,e,r,c)}while(!(r[0]instanceof RootStack))}}else e===OPERATIONS.UNWRAP?(n[s]=[r[0][0]],r=r[0].concat(r.slice(1))):e===OPERATIONS.WRAP?(n[s]=[r],r=[]):n[s]=[r[0]],t=i(t,e,r,c);return t})));return[t,n,o];function i(e,t,n,o){return e[MARKS.RESOLVE],e[MARKS.RESOLVE]={[MARKS.PARENT]:e,[MARKS.TYPE]:t,[MARKS.SLICE_HOOKS]:o.length?new Set(o.splice(0)):null,[MARKS.BUBBING_HOOKS]:n.slice(1).reverse()}}}function unwrapTokens(e){return e instanceof Token?e.value:e instanceof Array?e.map(unwrapTokens):e}exports.unwrapTokens=unwrapTokens}},__webpack_module_cache__={};function __webpack_require__(e){var t=__webpack_module_cache__[e];if(void 0!==t)return t.exports;var n=__webpack_module_cache__[e]={exports:{}};return __webpack_modules__[e](n,n.exports,__webpack_require__),n.exports}var __webpack_exports__={};(()=>{var e=__webpack_exports__;Object.defineProperty(e,"__esModule",{value:!0}),e.MATCH_CSS_ATTRIBUTE=e.MATCH_CSS_ATTRIBUTE_VALUE=void 0;const t=__webpack_require__(439),{FINISH:n,WRAP:o,UNWRAP:s,UNWRAP_ALL:i,OPTION:r,SPLIT:c,NO_COLLECT:u,NO_CAPTURE:l,MARK_AS_ROOT:O,FORK_IN_PARENT:_,FORK_IN_ROOT:S,END:f,END_ON_LEFT:R,useKey:a,node:E,key:A,pick:T,hook:p,pipe:N,prev:h,merge:P,MATCH_BEGIN:k,MATCH_END:K,MATCH_EOF:I,MERGE_ALL_TOKENS:C,UNFOLD:L}=t.OPERATIONS,d=[" ","\n","\t"],M=[[u,[["//",o,["\n",[I]],s],["/*",o,["*/",[I]],s]]]],g=[[u,d]],m=[[l,[" ","\n","\t","(",")","{","}",":"]]],w=function(e){return e.filter((e=>!(e instanceof t.Token)))},U=(E("Declaration").Wrapper,p((function(e,t,n){console.log("Invalid or unexpected token",t,n)}),1)),y=[['"',o,[[U,"\n"],["\\",["\\","\n",'"']],['"',s]]],["'",o,[[U,"\n"],["\\",["\\","\n","'"]],["'",s]]]],H=[[O,[[y],[[[k,"url(",o,[[y],[g],[")",s]]]]],[C,h(null,!0),"("],")",[g],[M],[C,h(null,!0),"%"],"/",","]]];e.MATCH_CSS_ATTRIBUTE_VALUE=H;const b=[[M],[g],[P((function([e,t]){return a(e,t)})),h((function(e){if(e instanceof t.Token)return!0})),u,":",o,[[H],["!important",l,[K," ","\n","}",";"]],[l,"}",s],[u,";",s],[I,s]]]];e.MATCH_CSS_ATTRIBUTE=b;const F=[E("CSSStyleRule"),A("selectorText",(function(e){return e.trim()})),h((function(e){if(e instanceof t.Token)return!0})),A("style"),E("CSSStyleDeclaration",void 0,!0),"{",o,[["}",s],[b]]],v=[O,E("CSSMediaRule"),"@media",m,o,A("media"),h((function(e){const t=e.value;return t.length-t.match(/\S|$/).index}),!0),A("cssRules",w),"{",o,S,"}",i],x=[E("CSSKeyframesRule"),"@keyframes",m,o,A("name"),h((function(e){if(e instanceof t.Token)return!0})),A("cssRules",w),"{",o,[["}",i],[E("CSSKeyframeRule"),"{",o,[["}",s],[b]]]]],D=[E("CSSFontFaceRule"),"@font-face",m,o,"{",o,[["}",i],[b]]],B=[O,E("CSSSupportsRule"),T((function(e){return[a("conditionText",e[1].value.trim()),a("cssRules",w(e[2]))]})),"@supports",m,o,"{",o,S,"}",i];e.default=[[M],[u,[["",d]]],B,F,v,x,D]})();var __webpack_export_target__=exports;for(var i in __webpack_exports__)__webpack_export_target__[i]=__webpack_exports__[i];__webpack_exports__.__esModule&&Object.defineProperty(__webpack_export_target__,"__esModule",{value:!0})})();
//# sourceMappingURL=css-grammar.js.map