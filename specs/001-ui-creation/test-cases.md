# Test Cases: くぅー画像生成UI（001-ui-creation）

**作成日**: 2025-12-12  
**対象Spec**: [spec.md](./spec.md)  
**対象Plan**: [plan.md](./plan.md)

## テスト方針

- **ユニットテスト**: 必須（選択肢/プロンプト/制約/エラー整形）
- **コンポーネントテスト**: 中（時間が許す範囲で）
- **E2Eテスト**: 実施しない（本アプリは小規模のため）

## 単体テスト

### プロンプト生成 (`app/lib/prompt/buildPrompt.ts`)

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| UT-001 | 正常系: プロンプトが正しく生成される | 3つの選択肢から適切なプロンプト文字列が生成されることを確認 | textPhrase, style, position が定義済み | 1. buildPrompt() を呼び出す<br>2. 返り値を確認 | textPhrase: {id: 'kuu', text: 'くぅー'}<br>style: {id: 'pop', promptHint: 'ポップなスタイル'}<br>position: {id: 'top-left', placementHint: '画像の左上'} | "くぅーという文字を、ポップなスタイルで、画像の左上に追加してください" という文字列が返る | `app/lib/prompt/buildPrompt.ts`<br>`buildPrompt()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 1 | P1 |
| UT-002 | 異常系: 未定義の選択肢が渡された場合 | エラーが適切に処理されることを確認 | - | 1. 未定義の選択肢を渡す<br>2. エラーハンドリングを確認 | textPhrase: null<br>style: undefined<br>position: undefined | TypeError が発生するか、適切なデフォルト値が使用される | `app/lib/prompt/buildPrompt.ts`<br>`buildPrompt()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 2 | P2 |

**単体テスト（プロンプト生成）セクション集計**:
- 行カバレッジ: 100%
- 分岐カバレッジ: 100%

### バリデーション (`app/lib/validate/validateSelections.ts`)

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| UT-003 | 正常系: すべての選択肢が有効 | 有効な選択肢の組み合わせが検証を通過することを確認 | 選択肢データが定義済み | 1. 有効な選択肢IDを渡す<br>2. 検証結果を確認 | textPhraseId: 'kuu'<br>styleId: 'pop'<br>positionId: 'top-left' | 検証成功（true または エラーなし） | `app/lib/validate/validateSelections.ts`<br>`validateSelections()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 1 | P1 |
| UT-004 | 異常系: 無効な選択肢ID | 無効なIDが検証で拒否されることを確認 | 選択肢データが定義済み | 1. 存在しないIDを渡す<br>2. 検証結果を確認 | textPhraseId: 'invalid'<br>styleId: 'pop'<br>positionId: 'top-left' | 検証失敗（false または エラーメッセージ） | `app/lib/validate/validateSelections.ts`<br>`validateSelections()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 2 | P1 |
| UT-005 | 異常系: 選択肢IDが未指定 | 未指定のIDが検証で拒否されることを確認 | - | 1. null または undefined を渡す<br>2. 検証結果を確認 | textPhraseId: null<br>styleId: undefined<br>positionId: '' | 検証失敗（false または エラーメッセージ） | `app/lib/validate/validateSelections.ts`<br>`validateSelections()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 2 | P1 |

**単体テスト（バリデーション）セクション集計**:
- 行カバレッジ: 100%
- 分岐カバレッジ: 100%

### 画像アップロードバリデーション（クライアント側）

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| UT-006 | 正常系: JPEG画像（10MB以下） | 有効なJPEG画像が検証を通過することを確認 | - | 1. JPEG形式、10MB以下のファイルを渡す<br>2. 検証結果を確認 | File: {type: 'image/jpeg', size: 5 * 1024 * 1024} | 検証成功 | `app/components/KuuGenerator/UploadSection.tsx`<br>バリデーション関数 | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 1 | P1 |
| UT-007 | 正常系: PNG画像（10MB以下） | 有効なPNG画像が検証を通過することを確認 | - | 1. PNG形式、10MB以下のファイルを渡す<br>2. 検証結果を確認 | File: {type: 'image/png', size: 8 * 1024 * 1024} | 検証成功 | `app/components/KuuGenerator/UploadSection.tsx`<br>バリデーション関数 | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 1 | P1 |
| UT-008 | 異常系: ファイルサイズ超過（10MB超） | 10MBを超えるファイルが検証で拒否されることを確認 | - | 1. 10MBを超えるファイルを渡す<br>2. 検証結果を確認 | File: {type: 'image/jpeg', size: 11 * 1024 * 1024} | 検証失敗（エラーメッセージ: "画像サイズは10MB以下にしてください"） | `app/components/KuuGenerator/UploadSection.tsx`<br>バリデーション関数 | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 2 | P1 |
| UT-009 | 異常系: 非対応形式（GIF） | JPEG・PNG以外の形式が検証で拒否されることを確認 | - | 1. GIF形式のファイルを渡す<br>2. 検証結果を確認 | File: {type: 'image/gif', size: 1 * 1024 * 1024} | 検証失敗（エラーメッセージ: "JPEGまたはPNG形式の画像を選択してください"） | `app/components/KuuGenerator/UploadSection.tsx`<br>バリデーション関数 | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 2 | P1 |
| UT-010 | 異常系: ファイル未選択 | ファイルが選択されていない場合の処理を確認 | - | 1. null または undefined を渡す<br>2. 検証結果を確認 | File: null | 検証失敗（エラーメッセージ: "画像を選択してください"） | `app/components/KuuGenerator/UploadSection.tsx`<br>バリデーション関数 | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 2 | P1 |

**単体テスト（画像アップロードバリデーション）セクション集計**:
- 行カバレッジ: 100%
- 分岐カバレッジ: 100%

### エラーメッセージ整形 (`app/lib/errors/toUserMessage.ts`)

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| UT-011 | 正常系: ネットワークエラーをユーザー向けメッセージに変換 | 技術的なエラーがユーザー向けメッセージに変換されることを確認 | - | 1. ネットワークエラーオブジェクトを渡す<br>2. 変換結果を確認 | Error: {message: 'Network request failed'} | "ネットワークエラーが発生しました。接続を確認して再試行してください。" | `app/lib/errors/toUserMessage.ts`<br>`toUserMessage()` | 行カバレッジ: 100%<br>分岐カバレッジ: 80% | User Story 2 | P2 |
| UT-012 | 正常系: 不明なエラーを汎用メッセージに変換 | 未知のエラーが汎用メッセージに変換されることを確認 | - | 1. 未知のエラーオブジェクトを渡す<br>2. 変換結果を確認 | Error: {message: 'Unknown error'} | "予期しないエラーが発生しました。しばらくしてから再試行してください。" | `app/lib/errors/toUserMessage.ts`<br>`toUserMessage()` | 行カバレッジ: 100%<br>分岐カバレッジ: 80% | User Story 2 | P2 |

**単体テスト（エラーメッセージ整形）セクション集計**:
- 行カバレッジ: 100%
- 分岐カバレッジ: 80%

### 保存処理 (`app/lib/save/`)

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| UT-013 | 正常系: PCでのPNGダウンロード | PC環境でPNG形式の画像がダウンロードされることを確認 | ブラウザ環境（JSDOM等） | 1. saveOnDesktop() を呼び出す<br>2. ダウンロード動作を確認 | imageDataUrl: 'data:image/png;base64,...'<br>mimeType: 'image/png' | ダウンロードリンクが作成され、クリックイベントが発火する | `app/lib/save/saveOnDesktop.ts`<br>`saveOnDesktop()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 1 | P1 |
| UT-014 | 正常系: PCでのJPEGダウンロード | PC環境でJPEG形式の画像がダウンロードされることを確認 | ブラウザ環境（JSDOM等） | 1. saveOnDesktop() を呼び出す<br>2. ダウンロード動作を確認 | imageDataUrl: 'data:image/jpeg;base64,...'<br>mimeType: 'image/jpeg' | ダウンロードリンクが作成され、クリックイベントが発火する | `app/lib/save/saveOnDesktop.ts`<br>`saveOnDesktop()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 1 | P1 |
| UT-015 | 正常系: モバイルでのカメラロール保存（成功） | モバイル環境でカメラロール保存が成功することを確認 | navigator.share が利用可能 | 1. saveOnMobile() を呼び出す<br>2. 保存結果を確認 | imageDataUrl: 'data:image/jpeg;base64,...' | {success: true} が返る | `app/lib/save/saveOnMobile.ts`<br>`saveOnMobile()` | 行カバレッジ: 100%<br>分岐カバレッジ: 80% | User Story 1 | P1 |
| UT-016 | 正常系: モバイルでのカメラロール保存失敗時のフォールバック | カメラロール保存に失敗した場合、通常ダウンロードにフォールバックすることを確認 | navigator.share が利用不可 | 1. saveOnMobile() を呼び出す<br>2. フォールバック動作を確認 | imageDataUrl: 'data:image/jpeg;base64,...' | ダウンロードリンクが作成され、クリックイベントが発火する | `app/lib/save/saveOnMobile.ts`<br>`saveOnMobile()` | 行カバレッジ: 100%<br>分岐カバレッジ: 80% | User Story 2 | P1 |

**単体テスト（保存処理）セクション集計**:
- 行カバレッジ: 100%
- 分岐カバレッジ: 90%

**単体テスト全体集計**:
- 行カバレッジ: 100%
- 分岐カバレッジ: 92%

## 統合テスト

### API統合 (`app/api/`)

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| IT-001 | 正常系: `/api/options` が選択肢一覧を返す | APIが正しい形式で選択肢を返すことを確認 | 選択肢データが定義済み | 1. GET /api/options を呼び出す<br>2. レスポンスを確認 | - | {textPhrases: [...], styles: [...], positions: [...]} が返る | `app/api/options/route.ts`<br>`GET()` | 行カバレッジ: 100%<br>分岐カバレッジ: 100% | User Story 1 | P1 |
| IT-002 | 正常系: `/api/generate` が画像を生成して返す | 有効なリクエストで画像生成が成功することを確認 | モックサーバーが起動中 | 1. POST /api/generate にFormDataを送信<br>2. レスポンスを確認 | FormData: {image: File, textPhraseId: 'kuu', styleId: 'pop', positionId: 'top-left', outputFormat: 'png'} | {imageDataUrl: 'data:image/png;base64,...', mimeType: 'image/png', width: 1024, height: 1024} が返る | `app/api/generate/route.ts`<br>`POST()` | 行カバレッジ: 90%<br>分岐カバレッジ: 80% | User Story 1 | P1 |
| IT-003 | 異常系: `/api/generate` が必須項目不足でエラーを返す | 必須項目が不足した場合、400エラーが返ることを確認 | - | 1. 必須項目を欠いたFormDataを送信<br>2. レスポンスを確認 | FormData: {image: File}（他の項目なし） | {status: 400, error: '必須項目が不足しています'} が返る | `app/api/generate/route.ts`<br>`POST()` | 行カバレッジ: 90%<br>分岐カバレッジ: 80% | User Story 2 | P1 |
| IT-004 | 異常系: `/api/generate` が外部APIエラーで500を返す | 外部API呼び出しが失敗した場合、適切にエラーを返すことを確認 | モックサーバーがエラーを返す設定 | 1. POST /api/generate を呼び出す<br>2. エラーレスポンスを確認 | FormData: {image: File, ...} | {status: 500, error: '画像生成に失敗しました。...'} が返る | `app/api/generate/route.ts`<br>`POST()` | 行カバレッジ: 90%<br>分岐カバレッジ: 80% | User Story 2 | P1 |

**統合テスト（API統合）セクション集計**:
- 行カバレッジ: 92.5%
- 分岐カバレッジ: 80%

### Server Actions統合

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| IT-005 | 正常系: generateKuu が成功状態を返す | Server Actionが正常に完了し、成功状態を返すことを確認 | BFF APIが正常応答 | 1. generateKuu() を呼び出す<br>2. 返り値を確認 | FormData: {image: File, textPhraseId: 'kuu', ...} | {status: 'success', imageDataUrl: '...', mimeType: '...', width: ..., height: ...} が返る | `app/components/KuuGenerator/actions.ts`<br>`generateKuu()` | 行カバレッジ: 90%<br>分岐カバレッジ: 80% | User Story 1 | P1 |
| IT-006 | 異常系: generateKuu がエラー状態を返す | Server Actionがエラー時に適切なエラー状態を返すことを確認 | BFF APIがエラー応答 | 1. generateKuu() を呼び出す<br>2. 返り値を確認 | FormData: {image: File, ...} | {status: 'error', message: '...'} が返る | `app/components/KuuGenerator/actions.ts`<br>`generateKuu()` | 行カバレッジ: 90%<br>分岐カバレッジ: 80% | User Story 2 | P1 |

**統合テスト（Server Actions統合）セクション集計**:
- 行カバレッジ: 90%
- 分岐カバレッジ: 80%

### UI統合（コンポーネントテスト）

| テストID | テスト名 | テスト観点・目的 | 前提条件 | 実行手順 | テストデータ | 期待結果 | 対象ファイル/関数 | 予想カバレッジ率 | 関連ユーザーストーリー | 優先度 |
|---------|---------|-----------------|---------|---------|------------|---------|------------------|----------------|---------------------|--------|
| IT-007 | 正常系: 画像アップロード後にスタイル選択が表示される | 画像アップロード後、次のステップが表示されることを確認 | - | 1. 画像をアップロード<br>2. UIの状態を確認 | File: {type: 'image/jpeg', ...} | スタイル選択セクションが表示される | `app/components/KuuGenerator/KuuGenerator.tsx` | 行カバレッジ: 80%<br>分岐カバレッジ: 70% | User Story 1 | P2 |
| IT-008 | 正常系: 生成完了後に保存ボタンが表示される | 生成が完了した後、保存ボタンが表示されることを確認 | 生成が成功 | 1. 生成を実行<br>2. UIの状態を確認 | state: {status: 'success', ...} | 保存ボタンが表示される | `app/components/KuuGenerator/KuuGenerator.tsx` | 行カバレッジ: 80%<br>分岐カバレッジ: 70% | User Story 1 | P1 |
| IT-009 | 異常系: エラー時にエラーメッセージが表示される | エラー発生時、エラーメッセージが表示されることを確認 | 生成が失敗 | 1. 生成を実行（失敗）<br>2. UIの状態を確認 | state: {status: 'error', message: '...'} | エラーメッセージが表示される | `app/components/KuuGenerator/KuuGenerator.tsx` | 行カバレッジ: 80%<br>分岐カバレッジ: 70% | User Story 2 | P1 |
| IT-010 | 正常系: 生成中はボタンが無効化される | 生成中、ボタンが無効化されることを確認 | pending: true | 1. 生成を開始<br>2. ボタンの状態を確認 | pending: true | ボタンが disabled になる | `app/components/KuuGenerator/GenerateButton.tsx` | 行カバレッジ: 80%<br>分岐カバレッジ: 70% | User Story 1 | P2 |

**統合テスト（UI統合）セクション集計**:
- 行カバレッジ: 80%
- 分岐カバレッジ: 70%

**統合テスト全体集計**:
- 行カバレッジ: 87.5%
- 分岐カバレッジ: 76.7%

## 全体集計

- **単体テスト**: 行カバレッジ 100%、分岐カバレッジ 92%
- **統合テスト**: 行カバレッジ 87.5%、分岐カバレッジ 76.7%
- **全体**: 行カバレッジ 93.75%、分岐カバレッジ 84.35%

