# tai-hub（試作）

Sky: Children of the Light ファンツール群を1つのアプリへ統合する構想
（[SkyGame-Planner](https://github.com/Silverfeelin/SkyGame-Planner/) 参考）の、
**本格的なSPA統合を実際に試すための試作リポジトリ**です。

⚠️ **これは試作です。既存の各ツール（`item`/`emote`/`share`/`tai-nomacan`/
`star-candle`等）が引き続き正式版・本番環境です。** 動作確認のため仮の
GitHubリポジトリ（`taipak5000/tsts`）にpushしていますが、GitHub Pages等
への公開は行っていません。既存リポジトリには一切手を加えていません。

## 今回やったこと

- Node.js/npm等のビルドツールが無い環境のため、素のHTML/CSS/JSと
  ネイティブES Modules（`<script type="module">`）だけで動くSPA基盤を構築。
- ハッシュベースのルーター（`#/item/cape`等）、状態・ストレージ層
  （`skyProfiles_v1`・`nsKey`等、**既存itemサイトと完全に同じ
  localStorageキー名・データ形状**）、共有chrome（下部ドック・
  プロフィール切替モーダル・設定モーダル・ツール引き出し）を実装。
- **5ツール全てを完全移植**：
  - `item`（アイテム所持管理）：ダッシュボード（シーズン/イベント表示・
    12カテゴリのグリッド・横断検索）、12カテゴリすべての所持/お気に入り
    チェックページ、コスト集計ページ。
  - `emote`（エモート所持率管理）：エモート一覧（レベルごとの個別所持
    トグル）・称号・入手履歴・「1年前の今日」バナー。
  - `tai-nomacan`（ノマキャン計算機）：複数目標管理・ペース計算・獲得
    履歴（ストリーク＋推移グラフ）・デイリークエスト記録・称号。
  - `star-candle`（星のキャンドル計算機）：目標計算・赤闇の自動予測
    エンジン＋月表示カレンダー・獲得履歴・通知設定・称号。
  - `share`（創作物管理ツール）：唯一Vue 3（CDN読み込み・ビルドレス）で
    書かれているツールのため、**ユーザーの明示的な指示によりこのツール
    だけVueのまま移植**（他はすべてバニラJS）。カレンダー表示・作品の
    CRUD・一括操作・称号。ルート遷移のたびにVueアプリをmount/unmountし、
    多重マウントが起きないことを確認済み。

## 動作確認方法

ビルド不要ですが、ES Modulesは`file://`直接オープンでは動きません
（ブラウザのCORS制限のため）。ローカル静的サーバー経由で開いてください。
このリポジトリは`skyツール/`ディレクトリの兄弟フォルダとして配置されている
ため、`skyツール/`全体を静的サーバーのルートにして、
`http://localhost:<port>/tai-hub/` を開いてください。

## 既存itemサイトとのデータ互換性について

`skyProfiles_v1`・`gameItems_<cat>`・`wish_<cat>`・`itemAcquireLog_v1`・
`itemTitles_v1`等、既存の`item`サイト（taipak5000.github.io/tai-item/）が
使っているlocalStorageキーは、**キー名・データ形状を完全に一致させて**
実装しています。将来このリポジトリを同じ`taipak5000.github.io`ドメイン配下
（同一オリジン）にデプロイした場合、既存ユーザーが`item`サイトで保存した
データはそのまま引き継がれます（移行処理不要）。ローカル環境同士では
オリジンが異なる限りこの共有は成立しません。

## 今回スコープ外にしたもの（意図的な簡略化）

- **Service Worker / オフライン対応**：未実装。ローカル専用のためオフライン
  需要が無く、旧実装の「index.htmlだけnetwork-first」という特別扱いは、
  今回廃止した自己fetch問題への対処だったため、そのまま移植する意味が
  無い。デプロイが視野に入った段階で改めて設計する。
- **楽譜コンプリート管理（music_sheet）**：他の12カテゴリと違い
  `MUSIC_SHEETS`という別形状のデータ（曲ごとの入手方法・キャンドル
  コスト管理）を持つため、汎用カテゴリビューの前提に合わず、他4ツール
  と同じ「未移植」プレースホルダー扱いにしている。
- **称号・実績パネル**：保存レイヤー（`itemTitles_v1`・他ツールの
  実績を読む`CROSS_TOOL_TITLE_CATALOG`）は完全に移植済みだが、UIは
  プロフィール切替モーダル内の実績「件数」表示のみの軽量版に簡略化。
  元実装のフル展開パネルは未実装。
- **ダッシュボードモーダル（ドックの「ダッシュボード」ボタン）**：
  元の「今日/今週/今月」の3分割レイアウトではなく、現在のシーズン・
  開催中イベント・次回アップデート・再訪精霊の状態を1つのリストに
  まとめた軽量版。
- **横断検索**：元実装の多項目フィルター検索ではなく、アイテム名（日/英）
  だけで全カテゴリを串刺し検索する簡易版。
- **コスト集計ページの一部サブ機能**：課金アイテムプレゼント履歴等、
  個別編集が複雑な機能は簡略化している場合がある（詳細は
  `features/item/cost-view.js`のコメント参照）。
- **プロフィールの複製機能**：既存の`item`サイトにはそもそも存在しない
  機能（tai-card等、別ツールにのみある機能と混同しないよう明記）。
- **言語切替**：`location.reload()`で切り替える既存挙動のまま
  （リアクティブな再描画は今回作っていない）。
- **emote**：X（Twitter）への画像共有・カスタマイズ機能（Canvas 2Dで
  達成率カード画像を1から描画する専用コード）とホーム画面アイコンの
  カスタマイズ機能（単独PWA向けの機能でハブでは意味を持たない）は未移植。
- **tai-nomacan / star-candle**：各ツール独自の「🔄最新の状態に更新」
  ボタンと言語切替ボタンは未移植（前者はツールごとのService Worker
  キャッシュ回避策で、tai-hubはService Worker自体を持たないため不要。
  後者はハブの表示設定モーダルに同機能あり）。目標管理モーダルの
  ドラッグ物理演算つきボトムシートは、ハブ共通のシンプルなモーダルに
  簡略化。
- **share**：サイドバー開閉・フォーカストラップ・テーマ/言語のIIFE側
  ブリッジ呼び出しは、ハブの共有chrome（`js/chrome/*.js`）が全ルート
  共通で肩代わりするため除去。詳細は`features/share/share-view.js`
  冒頭のコメント参照。
- 各ツールの正確な簡略化・アダプテーション内容は、それぞれの
  `features/<tool>/*-view.js`冒頭のコメントに詳しく記載しています。

## ディレクトリ構成

詳細は各ファイルの冒頭コメントを参照。大まかな構成：

```
index.html          シェル本体
css/                 tokens.css(ハブ共通) / chrome.css(ドック・モーダル) / <tool>.css(各ツール専用・元配色維持)
js/                  router.js / router-registry.js / state.js / i18n.js / icon-sprite.js / app.js / chrome/*.js
features/item/        dashboard-view.js / category-view.js / cost-view.js / data/
features/emote/        emote-view.js / emote-state.js / data/
features/tai-nomacan/  nomacan-view.js / nomacan-history.js / nomacan-state.js / data/
features/star-candle/  star-candle-view.js / star-candle-forecast.js / date-utils.js / data/
features/share/        share-view.js（Vue 3をCDN読み込みしてマウント）
features/placeholder/  music_sheetのみ未移植（データ形状が異なるため）
```
