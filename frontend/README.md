# リアルタイム文字起こしWebアプリケーション

このアプリケーションは、ブラウザのWeb Speech APIを利用して、リアルタイムで音声の文字起こしを行うWebアプリケーションです。文字起こしした内容は、Scrapboxに簡単に送信することができます。

## 主な機能

- **リアルタイム文字起こし**: マイクボタンを押している間、リアルタイムで音声がテキストに変換されます。
- **Scrapbox連携**: 文字起こししたテキストを、指定したScrapboxのページに整形して送信します。
- **編集機能**: 文字起こしされたテキストは、送信前に自由に編集できます。
- **クライアントサイド完結**: 全ての処理はブラウザ内で完結しており、サーバーサイドの実装やAPIキーは不要です。

## 使用技術

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [React](https://reactjs.org/) - UIライブラリ
- [TypeScript](https://www.typescriptlang.org/) - JavaScriptへの静的型付け
- [Web Speech API](https://developer.mozilla.org/ja/docs/Web/API/Web_Speech_API) - ブラウザ標準の音声認識機能
- [date-fns](https://date-fns.org/) - 日付操作ライブラリ
- [React Icons](https://react-icons.github.io/react-icons/) - アイコンライブラリ

## 前提条件

- [Node.js](https://nodejs.org/) (v18.x以上)
- [npm](https://www.npmjs.com/) または [yarn](https://yarnpkg.com/)
- [Web Speech API](https://developer.mozilla.org/ja/docs/Web/API/Web_Speech_API#%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%83%BC%E3%81%AE%E4%BA%92%E6%8F%9B%E6%80%A7)をサポートする最新のブラウザ (例: Google Chrome)

## セットアップと起動方法

1.  **リポジトリをクローンする**
    ```bash
    git clone <repository-url>
    cd my-whisper-app
    ```

2.  **依存関係をインストールする**
    ```bash
    npm install
    # または
    # yarn install
    ```

3.  **開発サーバーを起動する**
    ```bash
    npm run dev
    # または
    # yarn dev
    ```

4.  ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 使い方

1.  アプリケーションをサポートされているブラウザで開きます。
2.  マイクへのアクセスを許可します。
3.  マイクのアイコンボタンを押し続けると録音が開始され、リアルタイムで文字起こしが表示されます。
4.  ボタンを離すと録音が停止します。
5.  必要に応じて、テキストエリア内のテキストを編集します。
6.  「Scrapboxに送信」ボタンをクリックすると、その日の日付がタイトルになったScrapboxのページが新しいタブで開かれ、本文にテキストが入力された状態になります。

## デプロイ方法

1. vercel
2. vercel --prod
