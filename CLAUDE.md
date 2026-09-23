# tai-hub — 作業時の注意事項

`tai-hub/`は、既存の各スタンドアロンサイト(`item`/`emote`/`share`/`tai-nomacan`/
`star-candle`/`wings`/`companion`/`spirit-catalog`/`tai-revisit`/`tai-score`/
`tai-card`/`tai-transfer`/`tai-info`/`profile`)を1つのSPAへ統合する試作
リポジトリ。ビルドツールなしのネイティブES Modules。各ツールは
`features/<tool>/`配下に移植され、`js/router-registry.js`のROUTESテーブルで
`js/router.js`のハッシュルーターに登録される。

親ディレクトリ(`skyツール/`)のCLAUDE.mdに書かれている全社的なルール
(Service Workerのstale-while-revalidate方針・開くアニメーションは
transitionでなくanimationにする・ボトムシートは常にフルワイド)は、
tai-hubで新しくモーダル/シートを書く場合にも同様に適用される。それに加えて、
以下はtai-hub固有の「移植作業で実際に繰り返し発生した」不具合パターン。
新しくツールを移植する時、既存の移植済みツールを直す時は、必ずこのページを
確認すること。

## 🩹 コメント内でクラス名を`/`区切りで列挙すると、CSSコメントが途中で終わる

**日本語のdocコメント内で「このクラス群は使われなくなった」のような説明を
書く時、複数のクラス名を`.foo-*/.bar*/.baz-*`のように`/`で区切って列挙する
書き方を絶対にしないこと。** 過去に実際に発生した、影響が非常に大きい不具合
(2026-09-23発見)。`wg-i-*`のような命名規則の説明でも同様に注意。

CSSの`/* ... */`コメントは(JSのブロックコメントも同様)最初に出現した`*/`で
問答無用に閉じる仕様で、途中でネストしたり長さを推測したりはしない。
「クラス名-*」の直後に区切りの`/`を置くと、「-\*」+「/」が文字通り
コメント終端記号`*/`になってしまい、**その時点でコメントが強制的に閉じる**。
実例(`css/companion.css`): `.pf-modal-*/.sidebar*/.site-dock*/.lang-select`と
書いたところ、`.pf-modal-*/`の部分でコメントが閉じてしまい、続く
「.sidebar*/.site-dock*/...」からコメントの本来の閉じ`*/`までの間が
**CSSとして解釈されてしまい**(日本語の地の文でCSS構文として無意味)、
パーサーはこれをエラーとして復旧しようとした結果、直後にあった本物の
`.companion-view{ --card-bg:#fff; --text-color:#000; ... 20個以上のトークン }`
という**ルート定義ルールが丸ごと消滅**した。ダークモード用の上書きブロックは
別の場所にあり無事だったため、**ライトモード限定で**カードの背景・文字色・
枠線色が軒並み未定義(空文字列)になり、「背景が透けて見える」
「文字色がおかしい」という一見無関係に見える不具合として現れた
——コンソールエラーは一切出ない。同種の不具合はこのセッション中に
`wings`(`pfDash*/pfReminder*`)・`data-transfer`・`companion`・
`features/item/coord/my-coord.js`の計4箇所で独立に発生している。

**対処**: クラス名を列挙する時は`/`ではなく`・`(中黒)や読点、カンマ+スペース
などCSS的に無害な区切り文字を使う。`.pf-modal-*・.sidebar*・.site-dock*`
のように書けば、`*・`はコメント終端記号にならないため安全。

**検出方法**(新しくコメントを書き足した後、既存コメントを疑う時は必ず実行)：
非ネストのCSSコメント解析(最初の`*/`で問答無用に閉じる)を正しく再現し、
検出したコメントの終端直前の文字が英数字/ハイフンかどうかを調べる
——自然な日本語コメントの終わりは通常、空白・句読点・括弧閉じなどで終わる
はずで、英数字やハイフンが`*/`に直接くっついているのは「本来もっと長い
コメントのつもりだったのに、途中の`単語-*/`で事故的に閉じてしまった」
ことを示す強いシグナルになる：

```python
import re, glob
for f in glob.glob('**/*.js', recursive=True) + glob.glob('**/*.css', recursive=True):
    text = open(f, encoding='utf-8').read()
    i, in_comment, start = 0, False, None
    while i < len(text) - 1:
        if not in_comment and text[i:i+2] == '/*':
            in_comment, start = True, i; i += 2; continue
        if in_comment and text[i:i+2] == '*/':
            content = text[start+2:i]
            if content and re.match(r'[A-Za-z0-9_-]', content[-1]):
                print(f, start, repr(content[-50:]))
            in_comment = False; i += 2; continue
        i += 1
```

見つかった箇所だけを機械的に直すのではなく、**修正後に該当ファイルの
ルート要素(`.<tool>-view`)のCSSカスタムプロパティがブラウザで実際に
`getComputedStyle(el).getPropertyValue('--xxx')`で解決するかまで
必ず確認する**こと——「動いているように見える」だけでは、変数が
未定義のままフォールバック値やブラウザ既定値で偶然それらしく
表示されているだけ、というケースを見逃す。

## 🩹 アイコンは`class="inline-icon"`を省略すると黒塗りになる

**`<svg><use href="#i-xxx"/></svg>`パターンでアイコンを書く時は、
必ず`class="inline-icon"`を付けること。** 過去に実際に発生した不具合。

`js/icon-sprite.js`(共有)や各ツールがmount時に注入するローカルスプライトの
`<symbol>`は、アウトライン表示を前提に`fill:none; stroke:currentColor;`が
`.inline-icon`クラス経由で適用される設計。このクラスを書き忘れると、
ブラウザの既定値`fill:black`がそのまま効き、塗りつぶし可能な形状を持つ
パスは黒い塊としてレンダリングされる——コンソールエラーは一切出ず、
`<use href>`の参照先シンボルも正しく存在するため、実際に画面を見ないと
気付けない。5ツール移植時に64箇所、その後の追加パスで3箇所、9ツール
移植時にも複数箇所で再発した(コピー元コードから`<svg>...</svg>`を
コピペする際にクラスだけ落ちる、という単純なミスが繰り返し起きている)。

検出はripgrepでは(lookaheadが必要で)厳しいので、Pythonで機械的に走査する：

```python
import re, glob
pattern = re.compile(r'<svg([^>]*)>((?:(?!</svg>).)*?<use href="#i-[^"]+"[^>]*/?>(?:(?!</svg>).)*?)</svg>', re.DOTALL)
for f in glob.glob('**/*.js', recursive=True):
    content = open(f, encoding='utf-8').read()
    broken = [m for m in pattern.findall(content) if 'inline-icon' not in m[0]]
    if broken: print(f, len(broken))
```

一括修正は同じ正規表現で`<svg`の直後に`class="inline-icon"`を挿入すればよい
(個々の`<path>`が独自に`fill="currentColor" stroke="none"`等を持つ場合は
そちらが優先されるため、機械的に全箇所へ付与しても安全)。

関連する別バグ：`#i-xxx`で参照しているシンボルIDが`js/icon-sprite.js`や
ローカルスプライトに実在しないケース(この場合は黒塗りではなく「何も
表示されない」——`SITE_LINKS`の`icon`フィールドで実際に発生した)。
アイコンを使う場所を新しく追加したら、参照先シンボルが定義済みかも
あわせて確認すること。

## 🩹 移植した`<button>`要素は`border`/`background`を必ず自分で明示する

**新しく`<button class="...">`要素を書く時、既存のものを直す時は、
そのクラス自身のCSSルールに`border`(と必要なら`background`)を必ず
明示すること。** 過去に実際に発生した不具合(2026-09-23)。

移植元の各スタンドアロンサイトは、ページ先頭の`<style>`に
`button { cursor:pointer; border:none; background:none; font-family:inherit; }`
という**ページ全体に効くグローバルリセット**を必ず持っている。tai-hubは
複数ツールが1ページに同居するため、この手のグローバルリセットは意図的に
使わず、代わりに個々のボタンクラス(`.feature-btn`・`.cat-tile`等)が
それぞれ`border: 0;`を自分で書く、という規約になっている——しかし
`features/item/category-view.js`の`.cv-tile-fav-btn`/`.cv-tile-wish-btn`
(お気に入り/ウィッシュリストのタイルボタン)と、同じパターンを複製した
`css/item-music-sheet.css`の`.ms-tile-fav-btn`/`.ms-tile-wish-btn`、
さらに`.cv-view-toggle-btn`/`.ms-view-toggle-btn`(グリッド/リスト切替)が、
`background`(と`.cv-tile-*`は半透明度)だけ調整して`border`のリセットを
書き忘れていたため、ブラウザ既定の「2px outset」枠線が消えずに残り、
特に円形の丸ボタンでは黒っぽいリングが浮いて見える不具合になっていた
(ユーザーからは「アイコンボタンがギラギラして浮いて見える」という、
原因がbox-shadowだと誤解しやすい形で報告された——実際にはbox-shadow
除去だけでは直らず、border未リセットが真因だった)。

検出は、移植元サイトの対応する要素と`getComputedStyle(el).border`を
突き合わせるのが確実(見た目だけでは既定の枠線か意図した枠線か判別しにくい)。
新しくボタンを移植・追加する際は、以下を毎回セットで確認する：

```js
// ブラウザのコンソール等で
const el = document.querySelector('.your-new-btn');
getComputedStyle(el).border   // "0px none ..." になっているか
getComputedStyle(el).background // 意図した色 or "none" になっているか(既定は薄灰色)
```

## 🩹 移植作業は「その場で動いて見える」だけでは終わりにしない

9ツール大量移植バッチ(2026-09-23)の直後、ユーザーから「幅が画面に合わせて
伸びている」「記号が黒くなっている」「背景が透けている」という指摘が複数の
ページにわたって出た。各移植エージェントは自分の担当ツールを個別にブラウザで
動作確認していたが、①他の移植済みツールとの相対比較、②本家サイトの
`getComputedStyle`との数値突き合わせ、③複数ツールを横断した共通パターンの
再発チェック、まではしていなかった。新しくツールを移植・修正したら、
「動く」で終わらせず、上記2つのパターン(アイコンクラス・ボタンの
border/background)を機械的に再走査し、かつ本家サイトと横に並べて
`max-width`/コンテナ幅・背景色・枠線を数値で突き合わせることまでを
「移植完了」の条件とする。
