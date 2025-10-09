# cutmo - カットモデルマッチングプラットフォーム

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
- Instagram プロフィールを用いた応募
- 応募状況の管理（選考中/採用/不採用）
- プロフィール管理

## 🛠️ セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd cutmo
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
2. `cutmo_db_schema.sql`の内容を貼り付けて実行
3. すべてのテーブル、インデックス、RLSポリシーが作成されます

#### 3.3 認証設定
1. Authentication > Providers で Email を有効化
2. Email Templates で確認メールのテンプレートを設定（任意）

### 4. 環境変数の設定

`.env.example`をコピーして`.env`を作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集し、Supabaseの認証情報を設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

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
/cutmo
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
- `DashboardPage`: マイページ（応募一覧/募集一覧）
- `RecruitmentDetailPage`: 募集詳細・応募ページ

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
3. `cutmo`リポジトリを選択

### 3. 環境変数の設定
Vercel プロジェクト設定で以下の環境変数を追加：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 4. デプロイ
自動的にデプロイが開始されます。以降、mainブランチへのプッシュで自動デプロイされます。

## 📝 使用方法

### 学生ユーザー
1. 学校発行メールアドレス（.ac.jp）で新規登録
2. トップページで募集を閲覧
3. 気になる募集に応募（Instagram URL必須）
4. マイページで応募状況を確認

### サロンユーザー
1. 通常のメールアドレスで新規登録
2. マイページから募集を作成
3. 応募者を確認し、選考
4. 採用者とチャット（将来実装予定）

## 🔒 セキュリティ

- Row Level Security (RLS) によるデータアクセス制御
- 学校メールアドレス認証（.ac.jp）
- UUID による主キー
- パスワードは Supabase で安全にハッシュ化

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

### 認証エラー
- Email認証が有効になっているか確認
- RLSポリシーが正しく設定されているか確認

### データが表示されない
- ブラウザのコンソールでエラーを確認
- Supabase ダッシュボードでテーブル構造を確認

## 📄 ライセンス

MIT

## 👥 貢献

プルリクエストを歓迎します！

## 📧 お問い合わせ

問題や質問がある場合は、Issueを作成してください。