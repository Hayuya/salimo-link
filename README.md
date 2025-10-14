# SaloMo Link - カットモデルマッチングプラットフォーム

学生とカットモデルを探す美容室アシスタントを安全かつ効率的に繋ぐ、学校発行メールアドレス認証付きのマッチングプラットフォーム。

## 🚀 技術スタック

- **フロントエンド**: Vite + React (18.2.0) + TypeScript
- **バックエンド & DB**: Supabase (Authentication, Database, Storage)
- **スタイリング**: CSS Modules（UIライブラリ不使用）
- **デプロイ**: Vercel

## 📋 機能一覧

### ユーザー種別
1. **学生**: 学校発行メールアドレス（.ac.jp）で登録し、カットモデルに応募
2. **サロン**: 募集を作成し、応募者を選考
3. **マスター**: Supabase管理画面から全体を管理

### 主要機能
- 学校メールアドレス認証による安全な登録
- 募集の作成・閲覧・応募
- 日時指定による予約システム
- 応募状況の管理（承認待ち/承認/キャンセル）
- プロフィール管理

## 🛠️ セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd salomo-link
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabase プロジェクトのセットアップ

#### 3.1 Supabase アカウント作成
1. [Supabase](https://supabase.com/)にアクセス
2. アカウントを作成し、新しいプロジェクトを作成

#### 3.2 データベースのセットアップ
1. Supabase ダッシュボードの「SQL Editor」を開く
2. `database_schema.sql`の内容を貼り付けて実行
3. すべてのテーブル、インデックス、RLSポリシーが作成されます

**⚠️ 重要**: スキーマ実行後、以下を確認してください：
- テーブルが正しく作成されているか（students, salons, recruitments, reservations）
- トリガーが作成されているか（updated_atの自動更新、ユーザー登録時のプロフィール作成）
- RPC関数が作成されているか（make_reservation, cancel_reservation）
- RLSポリシーが有効になっているか

#### 3.3 認証設定
1. Authentication > Providers で Email を有効化
2. Authentication > URL Configuration で以下を設定：
   - Site URL: `http://localhost:3000` (開発時) / `https://your-domain.com` (本番時)
   - Redirect URLs: 同上を追加
3. Email Templates で確認メールのテンプレートを設定（任意）

### 4. 環境変数の設定

`.env`ファイルを作成し、Supabaseの認証情報を設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**🔒 セキュリティ重要事項:**
- **.envファイルは絶対にGitにコミットしないでください**
- .gitignoreに`.env`が含まれていることを確認してください
- 本番環境の認証情報は環境変数として設定してください
- anon keyは公開しても安全ですが、service_role keyは絶対に公開しないでください

**認証情報の取得方法:**
1. Supabase ダッシュボード > Settings > API
2. `Project URL` を `VITE_SUPABASE_URL` に設定
3. `anon public` キーを `VITE_SUPABASE_ANON_KEY` に設定

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## 📁 プロジェクト構成

```
/salomo-link
├── src/
│   ├── assets/          # 画像などの静的ファイル
│   ├── auth/            # 認証関連のロジック
│   ├── components/      # 再利用可能なUIコンポーネント
│   ├── hooks/           # カスタムReactフック
│   ├── lib/             # Supabaseクライアントなどのライブラリ
│   ├── pages/           # ページコンポーネント
│   ├── recruitment/     # 募集機能関連
│   ├── routes/          # ルーティング設定
│   ├── types/           # TypeScript型定義
│   ├── utils/           # ユーティリティ関数
│   ├── App.tsx          # アプリケーションルート
│   ├── main.tsx         # エントリーポイント
│   ├── global.css       # グローバルスタイル
│   ├── reset.css        # CSSリセット
│   └── variables.css    # CSS変数
├── database_schema.sql  # データベーススキーマ定義
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔑 主要コンポーネント

### 認証
- `useAuth`: 認証状態の管理（ログイン、ログアウト、登録）
- `ProtectedRoute`: ログイン必須ルートの保護

### ページ
- `TopPage`: 募集一覧（トップページ）
- `LoginPage`: ログインページ
- `SignupPage`: 新規登録ページ（学生/サロン切り替え）
- `DashboardPage`: マイページ（予約管理/募集管理）
- `RecruitmentDetailPage`: 募集詳細・予約ページ

### コンポーネント
- `Button`, `Input`, `Card`: 基本UIコンポーネント
- `Modal`: モーダルウィンドウ
- `Header`: ヘッダーナビゲーション
- `RecruitmentCard`: 募集情報カード

## 🚢 デプロイ（Vercel）

### 1. Vercelアカウントの作成
[Vercel](https://vercel.com/)でアカウントを作成

### 2. プロジェクトのインポート
1. Vercel ダッシュボードで「New Project」をクリック
2. GitHubリポジトリを連携
3. `salomo-link`リポジトリを選択

### 3. 環境変数の設定
Vercel プロジェクト設定で以下の環境変数を追加：
- `VITE_SUPABASE_URL`: あなたのSupabase Project URL
- `VITE_SUPABASE_ANON_KEY`: あなたのSupabase Anon Key

### 4. デプロイ
自動的にデプロイが開始されます。以降、mainブランチへのプッシュで自動デプロイされます。

### 5. 本番環境の設定
Supabaseの認証設定で、本番URLをRedirect URLsに追加してください。

## 📝 使用方法

### 学生ユーザー
1. 学校発行メールアドレス（.ac.jp）で新規登録
2. トップページで募集を閲覧
3. 気になる募集の詳細を確認
4. 予約可能な日時から選択して仮予約
5. マイページで予約状況を確認

### サロンユーザー
1. 通常のメールアドレスで新規登録
2. マイページから募集を作成
   - メニュー、条件、施術可能日時を設定
3. 予約リクエストを確認し、承認/キャンセル
4. 募集の編集・公開/非公開の切り替え

## 🔒 セキュリティ

- Row Level Security (RLS) によるデータアクセス制御
- 学校メールアドレス認証（.ac.jp）
- UUID による主キー
- パスワードは Supabase で安全にハッシュ化
- 予約の二重登録防止（トランザクション処理）
- 予約済み日時の削除防止

## 🌐 タイムゾーンの扱い

このアプリケーションは日本時間（JST, UTC+9）を基準としています：
- 日時入力時に自動的にJSTとして扱われます
- データベースにはUTC（ISO 8601形式）で保存されます
- 表示時にはJSTに変換されます

## 📦 ビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## 🧪 リント

```bash
npm run lint
```

## 🐛 トラブルシューティング

### Supabase接続エラー
- `.env`ファイルの環境変数が正しく設定されているか確認
- Supabase プロジェクトが有効化されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### 認証エラー
- Email認証が有効になっているか確認
- Redirect URLsが正しく設定されているか確認
- RLSポリシーが正しく設定されているか確認

### データが表示されない
- ブラウザのコンソールでエラーを確認
- Supabase ダッシュボードでテーブル構造を確認
- RPC関数が正しく作成されているか確認

### 予約ができない
- `make_reservation` 関数が正しく作成されているか確認
- `available_dates` フィールドがJSONB型になっているか確認
- ブラウザのコンソールでエラーメッセージを確認

### データベーススキーマのリセット
開発中にスキーマをリセットする場合：

```sql
-- 注意: すべてのデータが削除されます
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS recruitments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS salons CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS make_reservation CASCADE;
DROP FUNCTION IF EXISTS cancel_reservation CASCADE;

-- その後、database_schema.sqlを再実行
```

## 🔄 データベース構造の重要な変更点

このアプリケーションは以下の構造を使用しています：

### 予約可能日時の管理
`recruitments`テーブルの`available_dates`フィールドは、JSONB配列として管理されます：

```json
[
  {
    "datetime": "2025-10-15T10:00:00+09:00",
    "is_booked": false
  },
  {
    "datetime": "2025-10-15T14:00:00+09:00",
    "is_booked": true
  }
]
```

### 予約処理
予約作成時は`make_reservation`関数を使用することで：
- 日時の存在確認
- 予約済みチェック
- `is_booked`フラグの更新
が原子的に実行されます。

## 📄 ライセンス

MIT

## 👥 貢献

プルリクエストを歓迎します！

## 📧 お問い合わせ

問題や質問がある場合は、Issueを作成してください。

---

**⚠️ セキュリティに関する重要な注意事項:**
- 本番環境では必ず環境変数を使用してください
- `.env`ファイルは絶対にGitにコミットしないでください
- Supabaseのservice_role keyは絶対に公開しないでください
- 定期的にSupabaseのログを確認し、不正なアクセスがないか監視してください
