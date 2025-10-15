# 集中力管理システム (Focus Management System)

## プロジェクト概要
情報過多な日常の中でも、本当にやりたいことに集中できるようサポートする集中力管理システムです。Firebase 認証で安全にログインし、メインゴール・シャットダウンリスト・今日やることを一括管理できます。

### 主な機能
- **管理者ログイン / 新規登録**（Firebase Auth E-mail/Password）
- **メインゴール設定**（1件・期限オプション付き）
- **シャットダウンリスト管理**（SNS / 動画 / ニュース / その他）
- **今日やることリスト**（最大3件・チェックで完了管理）
- **ダッシュボード**
  - 統計カード（メインゴール数・シャットダウン中・今日完了・今日残り）
  - メインゴールのハイライト表示
  - シャットダウンリスト / 今日やることのテーブル表示

## 使い方
1. サインアップまたはログインします。
2. ダッシュボードで今もっとも集中したい「メインゴール」を設定します。
3. 集中を妨げるサービスを「シャットダウンリスト」に登録します。
4. 「今日やること」には具体的なアクションを最大3件登録し、完了したらチェックを付けます。
5. 統計カードで進捗状況を確認しながら、集中モードを継続しましょう。

## 開発環境セットアップ
1. リポジトリをクローンします。
2. 依存関係をインストールします。
   ```bash
   npm install
   ```
3. Firebase の環境変数を `.env.local` に設定します（詳細は後述）。
4. ローカル開発サーバーを起動します。
   ```bash
   npm run dev
   ```
5. ブラウザで `http://localhost:5173` を開き、アプリを確認します。

## 環境変数
Vite の命名規則に合わせて、以下のキーを `.env.local` などに設定してください。

```
VITE_FIREBASE_API_KEY=XXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdefg
```

## Firebase 設定手順
1. [Firebase コンソール](https://console.firebase.google.com/)で新しいプロジェクトを作成します。
2. 「Build」→「Authentication」で **メール/パスワード** を有効化します。
3. 「Build」→「Firestore Database」でデータベースを作成します（本番では本番モードを推奨）。
4. プロジェクト設定から Web アプリを追加し、構成情報を取得します。
5. 上記の環境変数にコピーし、`.env.local` として保存します。
6. Firestore のセキュリティルールは、必要に応じて認証済みユーザーのみに制限するなど調整してください。

## Vercel でのデプロイ手順（初心者向け）
1. [Vercel](https://vercel.com/) でアカウントを作成し、GitHub などのリポジトリを連携します。
2. 「New Project」から本リポジトリを選択します。
3. Build Command は `npm run build`、Output Directory は `dist` のままで問題ありません。
4. 「Environment Variables」に Firebase の設定値を **VITE_** 付きで登録します。
5. 「Deploy」を押すとビルドが始まり、成功すると公開用 URL が発行されます。
6. デプロイ後にアプリへアクセスし、Firebase Auth/Firestore が動作するかを確認します。

## ビルド & テスト
- 本番ビルド: `npm run build`
- ローカルプレビュー: `npm run preview`

## トラブルシューティング（Codex でできること）
- `npm install` で依存関係を再インストールする。
- `rm -rf node_modules package-lock.json` 後に再度 `npm install` でクリーンな状態にする。
- Vite のキャッシュが疑わしい場合は `rm -rf node_modules/.vite` を削除する。
- Firebase 環境変数のスペルミスや先頭の `VITE_` が欠けていないかを確認する。
- Firestore のルールで読み書きが制限されていないか、Firebase コンソールで確認する。
- ビルドログやブラウザコンソールに表示されるエラーを確認し、該当箇所を修正する。

## ライセンス
このプロジェクトは学習用途を想定しています。必要に応じてカスタマイズしてご利用ください。
