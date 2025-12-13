export function toUserMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof Error) {
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      return 'ネットワークエラーが発生しました。接続を確認して再試行してください。'
    }
    return '予期しないエラーが発生しました。しばらくしてから再試行してください。'
  }
  
  return '予期しないエラーが発生しました。しばらくしてから再試行してください。'
}

